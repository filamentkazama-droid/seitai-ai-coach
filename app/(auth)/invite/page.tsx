"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-browser";

export default function InvitePage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session));
      if (!data.session) setMessage("招待セッションを確認できません。最新の招待リンクから開き直してください。");
    });
  }, []);

  async function save() {
    if (password.length < 8) return setMessage("パスワードは8文字以上で入力してください。");
    if (password !== confirm) return setMessage("確認用パスワードが一致しません。");
    if (!sessionReady) return setMessage("招待セッションを確認できません。最新の招待リンクから開き直してください。");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage(error.message); setLoading(false); return; }
    window.location.href = "/dashboard";
  }

  return <main className="grid min-h-screen place-items-center px-4"><Card className="w-full max-w-md"><CardHeader><div className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-white"><KeyRound className="size-6" /></div><CardTitle>利用開始の設定</CardTitle><CardDescription>招待されたスタッフ用のパスワードを設定してください。</CardDescription></CardHeader><CardContent className="space-y-4"><Input type="password" placeholder="パスワード（8文字以上）" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!sessionReady} /><Input type="password" placeholder="パスワード確認" value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={!sessionReady} />{message ? <p className="text-sm text-danger">{message}</p> : null}<Button className="w-full" onClick={save} disabled={loading || !sessionReady}>{loading ? "設定中..." : "利用を開始"}</Button></CardContent></Card></main>;
}
