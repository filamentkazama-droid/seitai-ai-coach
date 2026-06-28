"use client";

import { useState } from "react";
import { Play, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SimulationPage() {
  const [messages, setMessages] = useState([
    { role: "patient", content: "腰痛は良くしたいんですけど、通う必要があるのか少し迷っています。" }
  ]);
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);

  function reply() {
    if (!input.trim()) return;
    setMessages([...messages, { role: "staff", content: input }, { role: "patient", content: "なるほど。料金と回数の理由がもう少しわかると安心できそうです。" }]);
    setInput("");
  }

  return (
    <div>
      <PageHeader title="次回接客シミュレーション" description="AIが患者役になり、ロールプレイ終了後に採点、添削、改善例を提示します。" />
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Play className="size-5 text-primary" />ロールプレイ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[52vh] space-y-3 rounded-xl bg-muted p-3">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "staff" ? "ml-auto max-w-[88%] rounded-xl bg-primary p-3 text-sm leading-6 text-white" : "mr-auto max-w-[88%] rounded-xl bg-white p-3 text-sm leading-6 shadow-sm"}>
                  <Badge className="mb-2">{message.role === "staff" ? "スタッフ" : "患者"}</Badge>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="患者へ返答する" onKeyDown={(event) => { if (event.key === "Enter") reply(); }} />
              <Button size="icon" onClick={reply}><Send className="size-5" /></Button>
              <Button variant="outline" onClick={() => setFinished(true)}>終了</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>ロールプレイ採点</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {finished ? (
              <>
                <div className="text-5xl font-bold">74点</div>
                <p className="text-sm leading-6 text-muted-foreground">共感は良好です。料金と回数の根拠を「検査結果」と「改善未来」に接続できると契約率が上がります。</p>
                <div className="rounded-xl bg-muted p-3 text-sm leading-6">
                  改善例: 「今日の検査だと、腰だけではなく股関節の動きが戻りやすさに関係しています。だから最初の4週間は週1回で土台を作るのが必要です。」
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">ロールプレイ終了後にAI採点を表示します。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
