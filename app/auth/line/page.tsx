"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-browser";

type LinkType = "invite" | "recovery";

function isLinkType(value: string | null): value is LinkType {
  return value === "invite" || value === "recovery";
}

function AuthLineContent() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const linkType = searchParams.get("type");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const validType = isLinkType(linkType) ? linkType : null;
  const title = useMemo(() => validType === "recovery" ? "パスワード再設定" : "利用開始の確認", [validType]);

  async function continueToPasswordSetup() {
    if (!tokenHash || !validType) {
      setMessage("リンク情報を確認できません。管理者から最新のリンクを受け取ってください。");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: validType
    });

    if (error) {
      setMessage("リンクが期限切れ、またはすでに使用されています。管理者から新しいリンクを受け取ってください。");
      setLoading(false);
      return;
    }

    window.location.href = "/invite";
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-white">
            <KeyRound className="size-6" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>ボタンを押して、パスワード設定へ進んでください。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          <Button className="w-full" onClick={continueToPasswordSetup} disabled={loading || !tokenHash || !validType}>
            {loading ? "確認中..." : "パスワード設定へ進む"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthLinePage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center px-4"><LoaderCircle className="size-8 animate-spin text-primary" /></main>}>
      <AuthLineContent />
    </Suspense>
  );
}
