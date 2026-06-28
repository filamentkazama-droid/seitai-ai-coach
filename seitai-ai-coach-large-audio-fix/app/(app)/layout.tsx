import Link from "next/link";
import { BarChart3, Bot, Building2, ClipboardList, Mic, ShieldCheck } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "分析", icon: BarChart3 },
  { href: "/upload", label: "添削", icon: Mic },
  { href: "/reports", label: "履歴", icon: ClipboardList },
  { href: "/coach", label: "コーチ", icon: Bot },
  { href: "/simulation", label: "練習", icon: ShieldCheck },
  { href: "/admin", label: "管理", icon: Building2 }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r bg-white/85 px-4 py-5 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-white">
            <Mic className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Seitai AI Coach</p>
            <p className="text-xs text-muted-foreground">教育と経営改善</p>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">{children}</main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-white/90 px-2 pt-2 backdrop-blur-xl lg:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-muted-foreground">
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
