"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Loader2, Pencil, Plus, Save, Shield, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/lib/types";

type Organization = { id: string; name: string };
type Clinic = { id: string; name: string; address: string | null };
type Profile = { id: string; clinic_id: string | null; full_name: string; role: UserRole; is_active: boolean };

export default function AdminPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>("staff");
  const [currentUserId, setCurrentUserId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [editingClinic, setEditingClinic] = useState<string | null>(null);
  const [clinicDraft, setClinicDraft] = useState({ name: "", address: "" });
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({ fullName: "", clinicId: "" });
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("staff");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const clinicNames = useMemo(() => new Map(clinics.map((clinic) => [clinic.id, clinic.name])), [clinics]);
  const isOwner = currentRole === "owner";

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin");
    const json = await response.json();
    if (response.ok) {
      setOrganization(json.organization as Organization);
      setOrganizationName(String(json.organization?.name ?? ""));
      setClinics(json.clinics as Clinic[]);
      setProfiles(json.profiles as Profile[]);
      setCurrentRole(json.currentRole as UserRole);
      setCurrentUserId(String(json.currentUserId ?? ""));
      setClinicId((current) => current || json.clinics?.[0]?.id || "");
    } else {
      setMessage(json.error ?? "管理データを取得できませんでした。");
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function post(body: Record<string, unknown>, success: string) {
    setMessage("");
    setSaving(true);
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await response.json();
    setMessage(response.ok ? success : json.error ?? "処理に失敗しました。");
    if (response.ok) await load();
    setSaving(false);
    return response.ok;
  }

  async function addClinic() {
    if (await post({ action: "addClinic", name: clinicName, address }, "店舗を追加しました。")) {
      setClinicName("");
      setAddress("");
    }
  }

  async function invite() {
    if (await post({ action: "invite", fullName, email, clinicId, role: inviteRole }, "招待メールを送信しました。")) {
      setFullName("");
      setEmail("");
    }
  }

  function startClinicEdit(clinic: Clinic) {
    setEditingClinic(clinic.id);
    setClinicDraft({ name: clinic.name, address: clinic.address ?? "" });
  }

  function startProfileEdit(profile: Profile) {
    setEditingProfile(profile.id);
    setProfileDraft({ fullName: profile.full_name, clinicId: profile.clinic_id ?? clinics[0]?.id ?? "" });
  }

  return (
    <div>
      <PageHeader title="管理画面" description="組織・店舗・スタッフ情報と権限を安全に管理します。" />
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {message ? (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 lg:col-span-2">
            <Check className="size-4" />{message}
          </div>
        ) : null}

        {isOwner ? (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />基本設定</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-medium">組織名
                  <Input className="mt-2" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="組織名" />
                </label>
                <Button disabled={saving || !organizationName || organizationName === organization?.name} onClick={() => void post({ action: "updateOrganization", name: organizationName }, "組織名を変更しました。")}>
                  <Save className="size-4" />保存
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />店舗管理</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {clinics.map((clinic) => editingClinic === clinic.id ? (
              <div key={clinic.id} className="space-y-3 rounded-2xl border p-4">
                <Input value={clinicDraft.name} onChange={(event) => setClinicDraft((draft) => ({ ...draft, name: event.target.value }))} placeholder="店舗名" />
                <Input value={clinicDraft.address} onChange={(event) => setClinicDraft((draft) => ({ ...draft, address: event.target.value }))} placeholder="住所 任意" />
                <div className="flex gap-2">
                  <Button disabled={saving || !clinicDraft.name} onClick={() => void post({ action: "updateClinic", clinicId: clinic.id, ...clinicDraft }, "店舗情報を変更しました。").then((ok) => ok && setEditingClinic(null))}><Save className="size-4" />保存</Button>
                  <Button variant="outline" onClick={() => setEditingClinic(null)}><X className="size-4" />取消</Button>
                </div>
              </div>
            ) : (
              <div key={clinic.id} className="flex items-center justify-between rounded-2xl border p-4">
                <div><p className="font-semibold">{clinic.name}</p><p className="mt-1 text-xs text-muted-foreground">{clinic.address || "住所未登録"}</p></div>
                {isOwner ? <Button variant="outline" onClick={() => startClinicEdit(clinic)} aria-label={`${clinic.name}を編集`}><Pencil className="size-4" />編集</Button> : null}
              </div>
            ))}
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-semibold">新しい店舗を追加</p>
              <Input placeholder="店舗名" value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
              <Input placeholder="住所 任意" value={address} onChange={(event) => setAddress(event.target.value)} />
              <Button onClick={addClinic} disabled={saving || !clinicName}><Plus className="size-4" />店舗を追加</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" />スタッフ招待</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="氏名" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <Input type="email" placeholder="メールアドレス" value={email} onChange={(event) => setEmail(event.target.value)} />
            <select value={clinicId} onChange={(event) => setClinicId(event.target.value)} className="h-12 w-full rounded-2xl border bg-white px-4">{clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}</select>
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as UserRole)} className="h-12 w-full rounded-2xl border bg-white px-4"><option value="staff">スタッフ</option><option value="manager">店長</option></select>
            <Button onClick={invite} disabled={saving || !email || !fullName || !clinicId}><UserPlus className="size-4" />招待メールを送る</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-5 text-primary" />スタッフ・権限管理</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />読み込み中...</p> : profiles.map((profile) => (
              <div key={profile.id} className="rounded-2xl border p-4">
                {editingProfile === profile.id ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                    <Input value={profileDraft.fullName} onChange={(event) => setProfileDraft((draft) => ({ ...draft, fullName: event.target.value }))} placeholder="氏名" />
                    <select value={profileDraft.clinicId} onChange={(event) => setProfileDraft((draft) => ({ ...draft, clinicId: event.target.value }))} className="h-12 rounded-2xl border bg-white px-4">{clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}</select>
                    <div className="flex gap-2">
                      <Button disabled={saving || !profileDraft.fullName || !profileDraft.clinicId} onClick={() => void post({ action: "updateProfile", profileId: profile.id, ...profileDraft }, "スタッフ情報を変更しました。").then((ok) => ok && setEditingProfile(null))}><Save className="size-4" />保存</Button>
                      <Button variant="outline" onClick={() => setEditingProfile(null)} aria-label="編集を取り消す"><X className="size-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-semibold">{profile.full_name}{profile.id === currentUserId ? <span className="ml-2 text-xs font-normal text-primary">あなた</span> : null}</p><p className="mt-1 text-xs text-muted-foreground">{profile.clinic_id ? clinicNames.get(profile.clinic_id) : "店舗未設定"}</p></div>
                    <div className="flex items-center gap-2">
                      {isOwner ? <Button variant="outline" onClick={() => startProfileEdit(profile)}><Pencil className="size-4" />編集</Button> : null}
                      {isOwner ? (
                        <select value={profile.role} onChange={(event) => void post({ action: "changeRole", profileId: profile.id, role: event.target.value }, "権限を変更しました。")} className="h-10 rounded-xl border bg-white px-3 text-sm"><option value="owner">オーナー</option><option value="manager">店長</option><option value="staff">スタッフ</option></select>
                      ) : <Badge>{profile.role}</Badge>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
