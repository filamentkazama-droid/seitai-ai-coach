"use client";

import { ChevronDown, MessageSquareText, Sparkles, TrendingUp } from "lucide-react";
import { RadarChart } from "@/components/charts/radar-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { emotionLabels, scoreLabels } from "@/lib/constants";
import type { AnalysisResult } from "@/lib/types";

type AnalysisPanelProps = {
  analysis: AnalysisResult;
  source: "demo" | "ai";
};

export function AnalysisPanel({ analysis, source }: AnalysisPanelProps) {
  return (
    <section id="analysis-results" className="space-y-4">
      <ResultSummary analysis={analysis} source={source} />
      <Accordion title="良かったポイント" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-3">
          {analysis.goodPoints.map((point) => (
            <div key={point} className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{point}</div>
          ))}
        </div>
      </Accordion>
      <Accordion title="改善ポイント" defaultOpen>
        <div className="grid gap-3 lg:grid-cols-3">
          {analysis.improvementPoints.map((point, index) => (
            <div key={point} className="rounded-2xl border bg-white p-4">
              <Badge tone="warning">改善 {index + 1}</Badge>
              <p className="mt-3 text-sm font-semibold leading-6">{point}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{analysis.improvementReasons[index]}</p>
            </div>
          ))}
        </div>
      </Accordion>
      <Accordion title="採点詳細">
        <ScoreTab analysis={analysis} />
      </Accordion>
      <Accordion title="契約率分析">
        <ContractTab analysis={analysis} />
      </Accordion>
      <Accordion title="話し方・感情分析">
        <TalkTab analysis={analysis} />
      </Accordion>
      <Accordion title="模範トーク">
        <ScriptTab analysis={analysis} />
      </Accordion>
    </section>
  );
}

function ResultSummary({ analysis, source }: AnalysisPanelProps) {
  const probability = analysis.contractPrediction.probability;
  const forecast = probability >= 75 ? "契約しそう" : probability >= 50 ? "微妙" : "厳しい";
  const tone = probability >= 75 ? "success" : probability >= 50 ? "warning" : "danger";

  return (
    <Card className="overflow-hidden border-primary/15 bg-white">
      <CardContent className="p-0">
        <div className="bg-primary px-5 py-4 text-white sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold opacity-90">添削結果サマリー</p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">今日見るべき結論</h2>
            </div>
            <Badge tone={source === "ai" ? "success" : "warning"}>{source === "ai" ? "AI分析結果" : "デモ表示"}</Badge>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:p-5">
          <SummaryMetric label="総合点数" value={`${analysis.overallScore}点`} />
          <SummaryMetric label="契約確率" value={`${probability}%`} />
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground">契約予測</p>
            <Badge tone={tone} className="mt-3 text-sm">{forecast}</Badge>
          </div>
          <div className="rounded-2xl bg-muted p-4 lg:col-span-1">
            <p className="text-xs font-semibold text-muted-foreground">今回最大の改善ポイント</p>
            <p className="mt-2 text-sm font-semibold leading-6">{analysis.improvementPoints[0]}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 lg:col-span-1">
            <p className="text-xs font-semibold text-emerald-800">次回一番意識すること</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{analysis.nextFocus[0]}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-normal">{value}</p>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-2xl border bg-white shadow-soft" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-bold sm:px-6">
        <span>{title}</span>
        <ChevronDown className="size-5 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="border-t p-4 sm:p-5">{children}</div>
    </details>
  );
}

function ScoreTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>総合点数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-bold">{analysis.overallScore}</span>
            <span className="pb-2 text-muted-foreground">/ 100</span>
          </div>
          <Progress value={analysis.overallScore} className="mt-5" />
          <div className="mt-6 h-72"><RadarChart /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>項目別スコア</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(analysis.scores).map(([key, value]) => (
            <div key={key} className="rounded-xl border p-3">
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>{scoreLabels[key as keyof typeof scoreLabels]}</span>
                <span>{value.score}点</span>
              </div>
              <Progress value={value.score} />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{value.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ContractTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" />契約確率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold">{analysis.contractPrediction.probability}%</div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{analysis.contractPrediction.reason}</p>
          <div className="mt-5 rounded-xl bg-secondary p-4">
            <p className="text-sm font-semibold">改善後予測</p>
            <p className="mt-1 text-3xl font-bold">{analysis.contractPrediction.improvedProbability}%</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>契約できる要因 / できない要因</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ReasonList title="契約できる要因" tone="success" items={analysis.contractPrediction.positiveFactors} />
          <ReasonList title="契約できない要因" tone="danger" items={analysis.contractPrediction.negativeFactors} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>契約を逃した決定的な一言</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {analysis.fatalPhrases.map((item, index) => (
            <div key={item.phrase} className="rounded-xl border p-4">
              <Badge tone="warning">#{index + 1}</Badge>
              <p className="mt-3 font-semibold">「{item.phrase}」</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>
              <p className="mt-3 rounded-xl bg-muted p-3 text-sm leading-6">{item.topStaffResponse}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TalkTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>感情分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(analysis.emotions).map(([key, value]) => (
            <div key={key}>
              <div className="mb-2 flex justify-between text-sm"><span>{emotionLabels[key as keyof typeof emotionLabels]}</span><span>{value.score}</span></div>
              <Progress value={value.score} />
              <p className="mt-1 text-xs text-muted-foreground">{value.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>話し方分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["スタッフ話す割合", `${analysis.talkAnalysis.staffTalkRatio}%`],
              ["患者話す割合", `${analysis.talkAnalysis.patientTalkRatio}%`],
              ["沈黙時間", `${analysis.talkAnalysis.silenceSeconds}秒`],
              ["質問回数", `${analysis.talkAnalysis.questionCount}回`],
              ["共感回数", `${analysis.talkAnalysis.empathyCount}回`],
              ["被せ", `${analysis.talkAnalysis.interruptions}回`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-muted p-4 text-sm leading-6">{analysis.talkAnalysis.improvement}</div>
          <div className="flex flex-wrap gap-2">
            {analysis.talkAnalysis.fillers.map((filler) => <Badge key={filler.word}>{filler.word} {filler.count}回</Badge>)}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>会話タイムライン</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.timeline.map((item) => (
            <div key={`${item.start}-${item.phase}`} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold">{item.start} - {item.end}</div>
              <div>
                <Badge>{item.phase}</Badge>
                <p className="mt-2 font-semibold">{item.summary}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.aiComment}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ScriptTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" />本人らしさを残した改善例</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl bg-muted p-4 text-sm leading-7 whitespace-pre-wrap">{analysis.improvedScript}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquareText className="size-5 text-primary" />トップスタッフの模範トーク</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl bg-muted p-4 text-sm leading-7 whitespace-pre-wrap">{analysis.modelTalk}</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>患者タイプ分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{analysis.patientType.primary}</Badge>
            <Badge>{analysis.patientType.secondary}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{analysis.patientType.proposalStrategy}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.topStaffComparison.map((item) => (
              <div key={item.item} className="rounded-xl border p-3">
                <p className="font-semibold">{item.item}</p>
                <p className="mt-2 text-sm text-muted-foreground">現在: {item.current} / トップ: {item.topStaff}</p>
                <p className="mt-1 text-sm">{item.gap}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReasonList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "danger" }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className={tone === "success" ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-danger"} />
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => <li key={item} className="rounded-xl bg-muted p-3 text-sm leading-5">{item}</li>)}
      </ul>
    </div>
  );
}
