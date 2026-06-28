import { NextResponse } from "next/server";
import { getOpenAI, analysisModel } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const utterance = String(body.utterance ?? "");
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: analysisModel,
      temperature: 0.4,
      messages: [
        { role: "system", content: "あなたは整体院の初回患者役です。慎重派で価格にも不安があります。自然な患者発話を1文で返してください。" },
        { role: "user", content: utterance }
      ]
    });
    return NextResponse.json({ message: completion.choices[0]?.message?.content ?? "" });
  } catch {
    return NextResponse.json({ message: "なるほど。料金と回数の理由がもう少しわかると安心できそうです。" });
  }
}
