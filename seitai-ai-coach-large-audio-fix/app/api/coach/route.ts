import { NextResponse } from "next/server";
import { getOpenAI, analysisModel } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const last = messages.at(-1)?.content ?? "";

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: analysisModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "あなたは整体院向けAI経営コーチです。契約率、失注理由、スタッフ教育の改善策を日本語で短く具体的に答えてください。"
        },
        {
          role: "user",
          content: `質問: ${last}\n\nデモ店舗指標: 平均点78点、契約率64%、主な失注理由は金額31%、必要性不足24%、家族相談18%。`
        }
      ]
    });

    return NextResponse.json({ message: completion.choices[0]?.message?.content ?? "" });
  } catch {
    return NextResponse.json({
      message: "今月は料金説明前の価値再提示と、家族相談への確認質問を重点改善してください。スタッフBは質問量、スタッフAはクロージングの言い切りが伸びしろです。"
    });
  }
}
