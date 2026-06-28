import { NextResponse } from "next/server";
import { zodResponseFormat } from "openai/helpers/zod";
import { analysisSchema } from "@/lib/ai-schema";
import { getOpenAI, analysisModel } from "@/lib/openai";
import { analysisSystemPrompt, buildAnalysisPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = String(body.transcript ?? "").trim();
    const learningContext = String(body.learningContext ?? "").trim();

    if (transcript.length < 5) {
      return NextResponse.json({ error: "分析する文字起こしを入力してください。" }, { status: 400 });
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.parse({
      model: analysisModel,
      response_format: zodResponseFormat(analysisSchema, "seitai_analysis"),
      messages: [
        { role: "system", content: analysisSystemPrompt },
        { role: "user", content: buildAnalysisPrompt(transcript, learningContext) }
      ]
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      return NextResponse.json({ error: "AI分析結果が空でした。" }, { status: 502 });
    }
    return NextResponse.json({ analysis: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI分析に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
