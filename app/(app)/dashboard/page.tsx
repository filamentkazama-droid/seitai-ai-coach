import { ArrowUpRight, Award, Brain, Download, Target, TrendingUp, TriangleAlert } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { RadarChart } from "@/components/charts/radar-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { demoRecordings } from "@/lib/demo-data";

const kpis = [
  { label: "今日の添削件数", value: "18件", delta: "+24%", icon: Brain },
  { label: "今月の契約率", value: "64%", delta: "+8%", icon: TrendingUp },
  { label: "平均点", value: "78点", delta: "+6点", icon: Target },
  { label: "AIおすすめ改善ポイント", value: "料金前の価値提示", delta: "最優先", icon: Brain },
  { label: "今週最も伸びたスタッフ", value: "スタッフB", delta: "+12点", icon: Award },
  { label: "最近多い失注理由", value: "金額", delta: "31%", icon: TriangleAlert }
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="店舗の教育・契約率・改善状況"
        description="音声添削、契約予測、失注理由、スタッフ別の改善推移を一つの画面で把握します。"
        action={<Button variant="outline"><Download className="size-4" />CSV出力</Button>}
      />
      <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="transition duration-200 hover:-translate-y-0.5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <kpi.icon className="size-5" />
                </div>
                <Badge tone={kpi.delta.startsWith("-") ? "success" : kpi.label.includes("失注") ? "warning" : "default"}>{kpi.delta}</Badge>
              </div>
              <p className="mt-4 text-sm font-semibold text-muted-foreground">{kpi.label}</p>
              <p className="mt-2 text-2xl font-bold leading-tight tracking-normal">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <Card className="border-primary/20 bg-white">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge tone="success">今日の重点</Badge>
              <h2 className="mt-3 text-xl font-bold tracking-normal">料金説明の前に、改善後の生活を一文で言う</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                失注理由の上位は金額ですが、AI判定では価格そのものより「必要性の納得不足」が先に発生しています。
              </p>
            </div>
            <Button><TrendingUp className="size-4" />改善計画を見る</Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>契約率と平均点の推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72"><LineChart /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>トップスタッフ比較</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72"><RadarChart /></div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="size-5 text-primary" />AIから今日のアドバイス</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              今月の失注は「料金前の価値再提示不足」と「家族相談への切り返し不足」が主因です。店長は料金説明前に改善未来を一文で言うロープレを重点実施してください。
            </p>
            <div className="space-y-3">
              {["料金説明前の価値提示", "確認質問の回数", "生活背景の深掘り"].map((item, index) => (
                <div key={item}>
                  <div className="mb-2 flex justify-between text-sm"><span>{item}</span><span>{[58, 71, 63][index]}%</span></div>
                  <Progress value={[58, 71, 63][index]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最新の添削</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoRecordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="text-sm font-semibold">{recording.staffName}</p>
                  <p className="text-xs text-muted-foreground">{recording.clinicName} / {recording.patientType}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={recording.status === "契約" ? "success" : recording.status === "失注" ? "danger" : "warning"}>{recording.status}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-bold">{recording.score}点</p>
                    <p className="text-xs text-muted-foreground">{recording.contractProbability}%</p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
