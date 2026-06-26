import { Download, FileText, Plus, Shield } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const members = [
  ["スタッフA", "owner", "デモ整体院 本店"],
  ["スタッフB", "manager", "デモ整体院 2号店"],
  ["スタッフC", "staff", "デモ整体院 本店"]
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="管理画面" description="店舗、スタッフ、権限、エクスポート、データ削除を管理します。Supabase RLSで権限ごとのアクセスを制御します。" />
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <Card>
          <CardHeader><CardTitle>店舗追加</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="店舗名" />
            <Input placeholder="住所 任意" />
            <Button><Plus className="size-4" />店舗を追加</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>スタッフ追加</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="氏名" />
            <Input placeholder="メールアドレス" />
            <Button><Plus className="size-4" />招待する</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-5 text-primary" />権限管理</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {members.map(([name, role, clinic]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{clinic}</p>
                </div>
                <Badge>{role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>出力とデータ管理</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline"><Download className="size-4" />CSV出力</Button>
            <Button variant="outline"><FileText className="size-4" />PDF出力</Button>
            <Button variant="destructive" className="sm:col-span-2">選択データを削除</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
