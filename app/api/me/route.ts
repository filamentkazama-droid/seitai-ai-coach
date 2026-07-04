import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  const { supabase, context } = await getAuthContext();
  if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: learning } = await supabase
    .from("staff_learning_profiles")
    .select("total_analyses, average_score, average_contract_probability, repeated_weaknesses, last_next_focus, updated_at")
    .eq("staff_id", context.userId)
    .maybeSingle();

  const row = learning as Record<string, unknown> | null;
  return NextResponse.json({
    profile: context,
    learning: row ? {
      totalAnalyses: Number(row.total_analyses ?? 0),
      averageScore: Number(row.average_score ?? 0),
      averageContractProbability: Number(row.average_contract_probability ?? 0),
      repeatedWeaknesses: Array.isArray(row.repeated_weaknesses) ? row.repeated_weaknesses : [],
      lastNextFocus: Array.isArray(row.last_next_focus) ? row.last_next_focus : [],
      lastUpdated: String(row.updated_at ?? "")
    } : null
  });
}

export async function DELETE() {
  const { supabase, context } = await getAuthContext();
  if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const { error } = await supabase.from("staff_learning_profiles").delete().eq("staff_id", context.userId);
  if (error) return NextResponse.json({ error: "学習履歴をリセットできませんでした。" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
