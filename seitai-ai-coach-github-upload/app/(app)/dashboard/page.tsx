import { ArrowUpRight, Award, Brain, Download, Target, TrendingUp, TriangleAlert } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { RadarChart } from "@/components/charts/radar-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAuthContext } from "@/lib/auth";
import type { AnalysisResult } from "@/lib/types";

type RecordingRow = { id: string; staff_id: string; status: string; lost_reason: string | null; created_at: string };
type AnalysisRow = { recording_id: string; overall_score: number; contract_probability: number; result: AnalysisResult; created_at: string };

export default async function DashboardPage() {
  const { supabase, context } = await getAuthContext();
  if (!context) return null;

  const [{ data: rawRecordings }, { data: rawAnalyses }, { data: rawProfiles }, { data: rawLearning }] = await Promise.all([
    supabase.from("recordings").select("id, staff_id, status, lost_reason, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("ai_analyses").select("recording_id, overall_score, contract_probability, result, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id, full_name").eq("organization_id", context.organizationId),
    supabase.from("staff_learning_profiles").select("staff_id, total_analyses, average_score, repeated_weaknesses").eq("organization_id", context.organizationId)
  ]);

  const recordings = (rawRecordings ?? []) as RecordingRow[];
  const analyses = (rawAnalyses ?? []) as AnalysisRow[];
  const profiles = new Map((rawProfiles ?? []).map((row) => [String(row.id), String(row.full_name)]));
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthAnalyses = analyses.filter((item) => new Date(item.created_at) >= startOfMonth);
  const monthOutcomes = recordings.filter((item) => new Date(item.created_at) >= startOfMonth && (item.status === "contracted" || item.status === "lost"));
  const contractRate = monthOutcomes.length ? Math.round(monthOutcomes.filter((item) => item.status === "contracted").length / monthOutcomes.length * 100) : 0;
  const averageScore = average(monthAnalyses.map((item) => item.overall_score));
  const averageProbability = average(monthAnalyses.map((item) => item.contract_probability));
  const topLearning = [...(rawLearning ?? [])].sort((a, b) => Number(b.average_score) - Number(a.average_score))[0];
  const topStaff = topLearning ? profiles.get(String(topLearning.staff_id)) ?? "-" : "-";
  const weaknessCounts = new Map<string, number>();
  (rawLearning ?? []).forEach((row) => {
    const items = Array.isArray(row.repeated_weaknesses) ? row.repeated_weaknesses as { text?: string; count?: number }[] : [];
    items.forEach((item) => {
      if (item.text) weaknessCounts.set(item.text, (weaknessCounts.get(item.text) ?? 0) + Number(item.count ?? 1));
    });
  });
  const topWeakness = [...weaknessCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "データ蓄積中";
  const lostReasonCounts = new Map<string, number>();
  recordings.filter((item) => item.status === "lost").forEach((item) => {
    const reason = item.lost_reason || "未入力";
    lostReasonCounts.set(reason, (lostReasonCounts.get(reason) ?? 0) + 1);
  });
  const topLostReason = [...lostReasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "データ蓄積中";
  const chart = buildChartData(analyses);
  const radar = buildRadarData(monthAnalyses);
  const latest = analyses.slice(0, 4).map((analysis) => {
    const recording = recordings.find((item) => item.id === analysis.recording_id);
    return { ...analysis, staffName: recording ? profiles.get(recording.staff_id) ?? "スタッフ" : "スタッフ", status: recording?.status ?? "follow_up" };
  });

  const kpis = [
    { label: "今日の添削件数", value: `${analyses.filter((item) => new Date(item.created_at) >= startOfToday).length}件`, delta: "実データ", icon: Brain },
    { label: "今月の契約率", value: monthOutcomes.length ? `${contractRate}%` : "未集計", delta: `${monthOutcomes.length}件`, icon: TrendingUp },
    { label: "今月の平均点", value: `${averageScore}点`, delta: "AI採点", icon: Target },
    { label: "AIおすすめ改善ポイント", value: topWeakness, delta: "最優先", icon: Brain },
    { label: "現在の上位スタッフ", value: topStaff, delta: topLearning ? `${Math.round(Number(topLearning.average_score))}点` : "-", icon: Award },
    { label: "最近多い失注理由", value: topLostReason, delta: "実績入力", icon: TriangleAlert }
  ];

  return (
    <div>
      <PageHeader title="店舗の教育・契約率・改善状況" description="ログイン中の組織に保存された添削結果をリアルタイムで集計します。" action={<Button variant="outline"><Download className="size-4" />CSV出力</Button>} />
      <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}><CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary"><kpi.icon className="size-5" /></div><Badge>{kpi.delta}</Badge></div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">{kpi.label}</p><p className="mt-2 text-xl font-bold leading-tight">{kpi.value}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="px-4 pt-4 sm:px-6 lg:px-8"><Card className="border-primary/20"><CardContent className="p-5">
        <Badge tone="success">今月の重点</Badge><h2 className="mt-3 text-xl font-bold">{topWeakness}</h2><p className="mt-2 text-sm text-muted-foreground">スタッフ別の繰り返し課題から自動集計しています。</p>
      </CardContent></Card></div>
      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:px-8">
        <Card><CardHeader><CardTitle>直近7日間の契約予測と平均点</CardTitle></CardHeader><CardContent><div className="h-72"><LineChart {...chart} /></div></CardContent></Card>
        <Card><CardHeader><CardTitle>今月のトップ基準比較</CardTitle></CardHeader><CardContent><div className="h-72"><RadarChart current={radar} /></div></CardContent></Card>
      </div>
      <div className="grid gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="size-5 text-primary" />AIから今日のアドバイス</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">今月は「{topWeakness}」を1つに絞って、添削後の模範トークを次回接客前に練習してください。</p><Progress value={monthAnalyses.length ? Math.min(100, monthAnalyses.length * 10) : 0} className="mt-4" /></CardContent></Card>
        <Card><CardHeader><CardTitle>最新の添削</CardTitle></CardHeader><CardContent className="space-y-3">{latest.length ? latest.map((item) => (
          <div key={item.recording_id} className="flex items-center justify-between rounded-2xl border p-4"><div><p className="text-sm font-semibold">{item.staffName}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("ja-JP")}</p></div><div className="flex items-center gap-3"><Badge tone="success">AI分析</Badge><div className="text-right"><p className="text-sm font-bold">{item.overall_score}点</p><p className="text-xs text-muted-foreground">{item.contract_probability}%</p></div><ArrowUpRight className="size-4" /></div></div>
        )) : <p className="text-sm text-muted-foreground">最初の添削を実行すると、ここに表示されます。</p>}</CardContent></Card>
      </div>
    </div>
  );
}

function average(values: number[]) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }

function buildChartData(analyses: AnalysisRow[]) {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return date; });
  return {
    labels: days.map((date) => `${date.getMonth() + 1}/${date.getDate()}`),
    contractData: days.map((day) => average(analyses.filter((item) => sameDay(new Date(item.created_at), day)).map((item) => item.contract_probability))),
    scoreData: days.map((day) => average(analyses.filter((item) => sameDay(new Date(item.created_at), day)).map((item) => item.overall_score)))
  };
}

function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function buildRadarData(analyses: AnalysisRow[]) {
  const keys = ["empathy", "interview", "inspection", "causeExplanation", "pricing", "closing"] as const;
  return keys.map((key) => average(analyses.map((item) => item.result?.scores?.[key]?.score ?? 0)));
}
