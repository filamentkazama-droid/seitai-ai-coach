"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signIn() {
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-white">
            <LockKeyhole className="size-6" />
          </div>
          <CardTitle className="text-xl">ログイン</CardTitle>
          <CardDescription>オーナー、店長、スタッフの権限で利用できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="メールアドレス" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input type="password" placeholder="パスワード" value={password} onChange={(event) => setPassword(event.target.value)} />
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          <Button className="w-full" onClick={signIn}>ログイン</Button>
        </CardContent>
      </Card>
    </main>
  );
}
