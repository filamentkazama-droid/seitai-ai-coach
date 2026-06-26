import { Filter, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lostReasons } from "@/lib/constants";
import { demoRecordings } from "@/lib/demo-data";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="過去データ分析" description="店舗、スタッフ、期間、契約状況、失注理由、点数で検索し、100件、500件、全件単位でAI集計できます。" />
      <div className="space-y-4 px-4 pb-10 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-5 text-muted-foreground" />
              <Input className="pl-10" placeholder="スタッフ名、店舗名、患者タイプで検索" />
            </div>
            <Button variant="outline"><Filter className="size-4" />フィルター</Button>
            <Button>AI全件分析</Button>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader><CardTitle>録音・添削履歴</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {demoRecordings.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold">{item.staffName}</p>
                    <p className="text-sm text-muted-foreground">{item.clinicName} / {new Date(item.createdAt).toLocaleString("ja-JP")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{item.patientType}</Badge>
                    <Badge tone={item.status === "契約" ? "success" : item.status === "失注" ? "danger" : "warning"}>{item.status}</Badge>
                    <span className="text-sm font-bold">{item.score}点</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>失注理由分析</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lostReasons.map((reason, index) => (
                <div key={reason} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm font-semibold">{reason}</span>
                  <span className="text-sm text-muted-foreground">{[31, 24, 18, 12, 9, 6][index]}%</span>
                </div>
              ))}
              <div className="rounded-xl bg-primary/5 p-4 text-sm leading-6">
                優先順位は「金額」より前の価値提示です。料金説明直前の改善未来トークを標準化してください。
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
