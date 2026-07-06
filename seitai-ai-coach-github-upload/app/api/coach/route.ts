import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getOpenAI, analysisModel } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, context } = await getAuthContext();
    if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const last = messages.at(-1)?.content ?? "";

    const [{ data: analyses }, { data: learning }, { data: recordings }, { data: profiles }] = await Promise.all([
      supabase.from("ai_analyses").select("overall_score, contract_probability, patient_type, created_at").eq("organization_id", context.organizationId).order("created_at", { ascending: false }).limit(500),
      supabase.from("staff_learning_profiles").select("staff_id, total_analyses, average_score, average_contract_probability, repeated_weaknesses, last_next_focus").eq("organization_id", context.organizationId),
      supabase.from("recordings").select("status, lost_reason, created_at").eq("organization_id", context.organizationId).order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("id, full_name, role").eq("organization_id", context.organizationId)
    ]);
    const profileNames = new Map((profiles ?? []).map((item) => [String(item.id), String(item.full_name)]));
    const averageScore = average((analyses ?? []).map((item) => Number(item.overall_score)));
    const averageProbability = average((analyses ?? []).map((item) => Number(item.contract_probability)));
    const staffSummary = (learning ?? []).map((item) => {
      const weaknesses = Array.isArray(item.repeated_weaknesses)
        ? (item.repeated_weaknesses as { text?: string }[]).slice(0, 3).map((weakness) => weakness.text).filter(Boolean).join("、")
        : "";
      return `${profileNames.get(String(item.staff_id)) ?? "スタッフ"}: ${item.total_analyses}件、平均${Math.round(Number(item.average_score))}点、課題=${weaknesses || "蓄積中"}`;
    }).join("\n");
    const lostReasons = new Map<string, number>();
    (recordings ?? []).filter((item) => item.status === "lost").forEach((item) => {
      const reason = String(item.lost_reason ?? "未入力");
      lostReasons.set(reason, (lostReasons.get(reason) ?? 0) + 1);
    });
    const lossSummary = [...lostReasons.entries()].sort((a, b) => b[1] - a[1]).map(([reason, count]) => `${reason}:${count}件`).join("、") || "まだ実績入力なし";

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: analysisModel,
      messages: [
        {
          role: "system",
          content: "あなたは整体院向けAI経営コーチです。与えられた店舗の実データだけを根拠に、契約率、失注理由、スタッフ教育の改善策を日本語で短く具体的に答えてください。データが不足する場合は推測せず、不足していると伝えてください。"
        },
        {
          role: "user",
          content: `質問: ${last}\n\n店舗実データ:\n分析件数=${analyses?.length ?? 0}\n平均点=${averageScore}\n平均契約予測=${averageProbability}%\n失注理由=${lossSummary}\nスタッフ別=${staffSummary || "まだデータなし"}`
        }
      ]
    });

    return NextResponse.json({ message: completion.choices[0]?.message?.content ?? "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AIコーチの回答に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}
