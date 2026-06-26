"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const examples = ["契約率を上げたい", "佐藤スタッフの弱点は？", "最近失注が増えた理由は？", "今月何を改善するべき？"];

export default function CoachPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "今月は料金説明前の価値提示が契約率に最も影響しています。スタッフ別に見ると、田中さんは確認質問を増やすと改善幅が大きいです。" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(content = input) {
    if (!content.trim()) return;
    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages })
    });
    const json = await response.json();
    setMessages([...nextMessages, { role: "assistant", content: json.message ?? "現在はデモ回答です。SupabaseとOpenAI設定後に実データで回答します。" }]);
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="AIコーチ" description="店舗データを自然言語で質問し、スタッフ教育、失注改善、今月の重点施策を会話で決めます。" />
      <div className="px-4 pb-10 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => <Button key={example} variant="outline" size="sm" onClick={() => send(example)}>{example}</Button>)}
            </div>
            <div className="min-h-[52vh] space-y-3 rounded-xl bg-muted p-3">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "ml-auto max-w-[88%] rounded-xl bg-primary p-3 text-sm leading-6 text-white" : "mr-auto max-w-[88%] rounded-xl bg-white p-3 text-sm leading-6 shadow-sm"}>
                  {message.role === "assistant" ? <Bot className="mb-2 size-4 text-primary" /> : null}
                  {message.content}
                </div>
              ))}
              {loading ? <div className="mr-auto rounded-xl bg-white p-3 text-sm">分析中...</div> : null}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="例: 今月何を改善するべき？" onKeyDown={(event) => { if (event.key === "Enter") void send(); }} />
              <Button size="icon" onClick={() => send()}><Send className="size-5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
