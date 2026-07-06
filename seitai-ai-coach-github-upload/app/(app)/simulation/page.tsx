"use client";

import { useState } from "react";
import { Loader2, Play, RotateCcw, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Message = { role: "patient" | "staff"; content: string };
type Grade = { score: number; goodPoint: string; improvementPoint: string; reason: string; improvedExample: string };

const initialMessage: Message = { role: "patient", content: "良くしたい気持ちはあるんですけど、本当に通う必要があるのか少し迷っています。" };

export default function SimulationPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [patientType, setPatientType] = useState("慎重派");
  const [concern, setConcern] = useState("料金と通院回数が不安");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reply() {
    if (!input.trim() || loading) return;
    const nextMessages: Message[] = [...messages, { role: "staff", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/simulation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reply", patientType, concern, messages: nextMessages }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "患者役の返答に失敗しました。");
      setMessages([...nextMessages, { role: "patient", content: String(json.message) }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "返答に失敗しました。");
    } finally { setLoading(false); }
  }

  async function finish() {
    if (loading || messages.length < 3) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/simulation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "grade", patientType, concern, messages }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "採点に失敗しました。");
      setGrade(json.grade as Grade);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "採点に失敗しました。");
    } finally { setLoading(false); }
  }

  function reset() { setMessages([initialMessage]); setGrade(null); setError(""); }

  return (
    <div>
      <PageHeader title="次回接客シミュレーション" description="患者タイプと不安を選び、AI患者とのロールプレイ終了後に実際の会話を採点します。" />
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Play className="size-5 text-primary" />AI患者ロールプレイ</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={patientType} onChange={(event) => setPatientType(event.target.value)} className="h-12 rounded-2xl border bg-white px-4 text-sm font-semibold">{["慎重派", "価格重視", "論理派", "感覚派", "家族相談タイプ", "症状改善重視"].map((item) => <option key={item}>{item}</option>)}</select>
            <Input value={concern} onChange={(event) => setConcern(event.target.value)} placeholder="患者の主な不安" />
          </div>
          <div className="min-h-[45vh] space-y-3 rounded-xl bg-muted p-3">{messages.map((message, index) => (
            <div key={index} className={message.role === "staff" ? "ml-auto max-w-[88%] rounded-xl bg-primary p-3 text-sm leading-6 text-white" : "mr-auto max-w-[88%] rounded-xl bg-white p-3 text-sm leading-6 shadow-sm"}><Badge className="mb-2">{message.role === "staff" ? "スタッフ" : "患者"}</Badge><p>{message.content}</p></div>
          ))}{loading ? <div className="mr-auto flex items-center gap-2 rounded-xl bg-white p-3 text-sm"><Loader2 className="size-4 animate-spin" />AIが考えています...</div> : null}</div>
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-danger">{error}</p> : null}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2"><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="患者へ返答する" onKeyDown={(event) => { if (event.key === "Enter") void reply(); }} /><Button size="icon" onClick={reply} disabled={loading}><Send className="size-5" /></Button><Button variant="outline" onClick={finish} disabled={loading || messages.length < 3}>終了・採点</Button></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>AI採点</CardTitle></CardHeader><CardContent className="space-y-4">{grade ? <><div className="text-5xl font-bold">{grade.score}点</div><div><p className="text-sm font-bold text-emerald-800">良かった点</p><p className="mt-1 text-sm leading-6">{grade.goodPoint}</p></div><div><p className="text-sm font-bold text-amber-800">改善ポイント</p><p className="mt-1 text-sm leading-6">{grade.improvementPoint}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{grade.reason}</p></div><div className="rounded-xl bg-muted p-3 text-sm leading-6"><strong>改善例</strong><br />{grade.improvedExample}</div><Button variant="outline" className="w-full" onClick={reset}><RotateCcw className="size-4" />もう一度練習</Button></> : <p className="text-sm text-muted-foreground">3往復ほど会話して「終了・採点」を押すと、実際の会話をAIが採点します。</p>}</CardContent></Card>
      </div>
    </div>
  );
}
