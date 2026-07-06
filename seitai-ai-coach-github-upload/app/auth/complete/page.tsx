"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function AuthCompletePage() {
  const [error, setError] = useState("");

  useEffect(() => {
    async function completeAuthentication() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const next = safeNextPath(url.searchParams.get("next"));
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const hashError = hash.get("error_description");

      if (hashError) {
        setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        window.location.replace(next);
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        window.location.replace(next);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace(next);
        return;
      }

      setError("招待リンクの認証情報を確認できませんでした。最新の招待メールからもう一度開いてください。");
    }

    void completeAuthentication();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">リンクを確認できませんでした</h1>
            <p className="mt-3 text-sm text-danger">{error}</p>
            <a className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-white" href="/login">
              ログイン画面へ
            </a>
          </>
        ) : (
          <>
            <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold">招待を確認しています</h1>
            <p className="mt-2 text-sm text-muted-foreground">この画面を閉じずにお待ちください。</p>
          </>
        )}
      </div>
    </main>
  );
}
