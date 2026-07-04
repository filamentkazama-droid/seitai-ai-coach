"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, Shield, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/lib/types";

type Clinic = { id: string; name: string; address: string | null };
type Profile = { id: string; clinic_id: string | null; full_name: string; role: UserRole; is_active: boolean };

export default function AdminPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>("staff");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("staff");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const clinicNames = useMemo(() => new Map(clinics.map((clinic) => [clinic.id, clinic.name])), [clinics]);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin");
    const json = await response.json();
    if (response.ok) {
      setClinics(json.clinics as Clinic[]);
      setProfiles(json.profiles as Profile[]);
      setCurrentRole(json.currentRole as UserRole);
      setClinicId((current) => current || json.clinics?.[0]?.id || "");
    } else setMessage(json.error ?? "管理データを取得できませんでした。");
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function post(body: Record<string, unknown>, success: string) {
    setMessage("");
    const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await response.json();
    setMessage(response.ok ? success : json.error ?? "処理に失敗しました。");
    if (response.ok) await load();
    return response.ok;
  }

  async function addClinic() {
    if (await post({ action: "addClinic", name: clinicName, address }, "店舗を追加しました。")) { setClinicName(""); setAddress(""); }
  }
  async function invite() {
    if (await post({ action: "invite", fullName, email, clinicId, role: inviteRole }, "招待メールを送信しました。")) { setFullName(""); setEmail(""); }
  }

  return (
    <div><PageHeader title="管理画面" description="店舗追加、スタッフ招待、権限変更を組織単位で安全に管理します。" />
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {message ? <div className="rounded-2xl bg-muted p-4 text-sm lg:col-span-2">{message}</div> : null}
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />店舗追加</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="店舗名" value={clinicName} onChange={(event) => setClinicName(event.target.value)} /><Input placeholder="住所 任意" value={address} onChange={(event) => setAddress(event.target.value)} /><Button onClick={addClinic} disabled={!clinicName}><Plus className="size-4" />店舗を追加</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" />スタッフ招待</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="氏名" value={fullName} onChange={(event) => setFullName(event.target.value)} /><Input type="email" placeholder="メールアドレス" value={email} onChange={(event) => setEmail(event.target.value)} /><select value={clinicId} onChange={(event) => setClinicId(event.target.value)} className="h-12 w-full rounded-2xl border bg-white px-4">{clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}</select><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as UserRole)} className="h-12 w-full rounded-2xl border bg-white px-4"><option value="staff">スタッフ</option><option value="manager">店長</option></select><Button onClick={invite} disabled={!email || !fullName || !clinicId}><UserPlus className="size-4" />招待メールを送る</Button></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-5 text-primary" />権限管理</CardTitle></CardHeader><CardContent className="space-y-3">{loading ? <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />読み込み中...</p> : profiles.map((profile) => <div key={profile.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{profile.full_name}</p><p className="text-xs text-muted-foreground">{profile.clinic_id ? clinicNames.get(profile.clinic_id) : "店舗未設定"}</p></div>{currentRole === "owner" ? <select value={profile.role} onChange={(event) => void post({ action: "changeRole", profileId: profile.id, role: event.target.value }, "権限を変更しました。") } className="h-10 rounded-xl border bg-white px-3 text-sm"><option value="owner">オーナー</option><option value="manager">店長</option><option value="staff">スタッフ</option></select> : <Badge>{profile.role}</Badge>}</div>)}</CardContent></Card>
      </div>
    </div>
  );
}
