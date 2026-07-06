import { NextResponse } from "next/server";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getAuthContext } from "@/lib/auth";
import { getOpenAI, analysisModel } from "@/lib/openai";

const gradeSchema = z.object({
  score: z.number().int().min(0).max(100),
  goodPoint: z.string(),
  improvementPoint: z.string(),
  reason: z.string(),
  improvedExample: z.string()
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { context } = await getAuthContext();
    if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

    const body = await request.json();
    const action = String(body.action ?? "reply");
    const patientType = String(body.patientType ?? "慎重派");
    const concern = String(body.concern ?? "料金と通院回数が不安");
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const transcript = messages.map((message: { role?: string; content?: string }) => `${message.role === "staff" ? "スタッフ" : "患者"}: ${String(message.content ?? "")}`).join("\n");
    const openai = getOpenAI();

    if (action === "grade") {
      const completion = await openai.chat.completions.parse({
        model: analysisModel,
        response_format: zodResponseFormat(gradeSchema, "roleplay_grade"),
        messages: [
          { role: "system", content: "あなたは整体院の接客教育責任者です。会話を共感、質問、必要性説明、料金への安心、クロージングで採点し、次回そのまま使える改善例を返してください。" },
          { role: "user", content: `患者タイプ=${patientType}\n主な不安=${concern}\n\n会話:\n${transcript}` }
        ]
      });
      const grade = completion.choices[0]?.message?.parsed;
      if (!grade) return NextResponse.json({ error: "採点結果を作成できませんでした。" }, { status: 502 });
      return NextResponse.json({ grade });
    }

    const lastStaffMessage = [...messages].reverse().find((message: { role?: string }) => message.role === "staff")?.content ?? "";
    const completion = await openai.chat.completions.create({
      model: analysisModel,
      messages: [
        { role: "system", content: `あなたは整体院の初回患者役です。患者タイプは「${patientType}」、不安は「${concern}」です。簡単には納得せず、スタッフの説明が具体的で安心できれば少しずつ前向きになります。患者として自然な日本語を1〜2文で返してください。採点や解説はしないでください。` },
        { role: "user", content: `これまでの会話:\n${transcript}\n\nスタッフの最新発言:${lastStaffMessage}` }
      ]
    });
    return NextResponse.json({ message: completion.choices[0]?.message?.content ?? "もう少し具体的に教えてもらえますか？" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ロールプレイ処理に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
