"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Trash2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearAnalysisHistory, loadAnalysisHistory, type AnalysisHistoryItem } from "@/lib/history";

export default function ReportsPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("すべて");
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | null>(null);

  useEffect(() => {
    const items = loadAnalysisHistory();
    setHistory(items);
    setSelectedItem(items[0] ?? null);
  }, []);

  const staffNames = useMemo(() => ["すべて", ...new Set(history.map((item) => item.staffName))], [history]);
  const filtered = useMemo(() => {
    return history.filter((item) => {
      const staffMatch = selectedStaff === "すべて" || item.staffName === selectedStaff;
      const queryMatch = [item.staffName, item.clinicName, item.memo, item.analysis.patientType.primary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      return staffMatch && queryMatch;
    });
  }, [history, query, selectedStaff]);
  const summary = useMemo(() => buildSummary(filtered), [filtered]);

  function clearAll() {
    clearAnalysisHistory();
    setHistory([]);
    setSelectedItem(null);
  }

  return (
    <div>
      <PageHeader
        title="スタッフ別フィードバック履歴"
        description="音声を送るたびに保存された添削結果を、スタッフ別に振り返れます。総合点、契約確率、改善ポイント、模範トークを確認できます。"
      />
      <div className="space-y-4 px-4 pb-10 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
              <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="スタッフ名、店舗名、メモで検索" />
            </div>
            <select
              value={selectedStaff}
              onChange={(event) => setSelectedStaff(event.target.value)}
              className="h-12 rounded-2xl border bg-white px-4 text-sm font-semibold"
            >
              {staffNames.map((name) => <option key={name}>{name}</option>)}
            </select>
            <Button variant="outline" onClick={clearAll} disabled={!history.length}>
              <Trash2 className="size-4" />
              履歴を削除
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="保存件数" value={`${summary.count}件`} />
          <SummaryCard label="平均点" value={`${summary.averageScore}点`} />
          <SummaryCard label="平均契約確率" value={`${summary.averageContractProbability}%`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>添削履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filtered.length ? filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full rounded-2xl border bg-white p-4 text-left transition hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.staffName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.clinicName}</p>
                    </div>
                    <Badge tone={item.source === "ai" ? "success" : "warning"}>{item.source === "ai" ? "AI分析" : "サンプル"}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniMetric label="総合" value={`${item.analysis.overallScore}`} />
                    <MiniMetric label="契約" value={`${item.analysis.contractPrediction.probability}%`} />
                    <MiniMetric label="患者" value={item.analysis.patientType.primary} />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-4" />
                    {new Date(item.createdAt).toLocaleString("ja-JP")}
                  </p>
                </button>
              )) : (
                <div className="rounded-2xl bg-muted p-5 text-sm leading-6 text-muted-foreground">
                  まだ保存された添削履歴がありません。音声アップロード画面でAI添削を実行すると、ここにスタッフ別で保存されます。
                </div>
              )}
            </CardContent>
          </Card>

          <FeedbackDetail item={selectedItem} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function FeedbackDetail({ item }: { item: AnalysisHistoryItem | null }) {
  if (!item) {
    return (
      <Card>
        <CardContent className="grid min-h-80 place-items-center p-6 text-center text-sm text-muted-foreground">
          履歴を選択すると、改善ポイントとフィードバック詳細を表示します。
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" />
            {item.staffName} のフィードバック
          </CardTitle>
          <Badge tone={item.source === "ai" ? "success" : "warning"}>{item.source === "ai" ? "AI分析結果" : "サンプル表示"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground">総合点数</p>
            <p className="mt-2 text-3xl font-bold">{item.analysis.overallScore}点</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground">契約確率</p>
            <p className="mt-2 text-3xl font-bold">{item.analysis.contractPrediction.probability}%</p>
          </div>
        </div>

        <Section title="今回最大の改善ポイント" items={item.analysis.improvementPoints} tone="warning" />
        <Section title="次回一番意識すること" items={item.analysis.nextFocus} tone="success" />
        <Section title="良かったポイント" items={item.analysis.goodPoints} tone="success" />

        <div className="rounded-2xl bg-muted p-4">
          <p className="text-sm font-bold">契約率分析</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.analysis.contractPrediction.reason}</p>
        </div>

        <details className="rounded-2xl border bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">模範トークを見る</summary>
          <p className="border-t p-4 text-sm leading-7 whitespace-pre-wrap">{item.analysis.modelTalk}</p>
        </details>

        <details className="rounded-2xl border bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">文字起こしを見る</summary>
          <p className="max-h-72 overflow-auto border-t p-4 text-sm leading-7 whitespace-pre-wrap">{item.transcript}</p>
        </details>
      </CardContent>
    </Card>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{title}</p>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <div key={item} className={tone === "success" ? "rounded-2xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-950" : "rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-950"}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSummary(items: AnalysisHistoryItem[]) {
  if (!items.length) {
    return { count: 0, averageScore: 0, averageContractProbability: 0 };
  }

  return {
    count: items.length,
    averageScore: Math.round(items.reduce((sum, item) => sum + item.analysis.overallScore, 0) / items.length),
    averageContractProbability: Math.round(items.reduce((sum, item) => sum + item.analysis.contractPrediction.probability, 0) / items.length)
  };
}
