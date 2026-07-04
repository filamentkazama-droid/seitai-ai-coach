import { NextResponse } from "next/server";
import { zodResponseFormat } from "openai/helpers/zod";
import { analysisSchema } from "@/lib/ai-schema";
import { getAuthContext } from "@/lib/auth";
import { buildLearningContext, type LearningProfile, updateLearningProfile } from "@/lib/learning";
import { getOpenAI, analysisModel } from "@/lib/openai";
import { analysisSystemPrompt, buildAnalysisPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, context } = await getAuthContext();
    if (!context) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const body = await request.json();
    const transcript = String(body.transcript ?? "").trim();
    const memo = String(body.memo ?? "").trim();
    const fileName = String(body.fileName ?? "").trim();

    if (transcript.length < 5) {
      return NextResponse.json({ error: "分析する文字起こしを入力してください。" }, { status: 400 });
    }

    const { data: rawLearning } = await supabase
      .from("staff_learning_profiles")
      .select("total_analyses, average_score, average_contract_probability, repeated_weaknesses, last_next_focus, updated_at")
      .eq("staff_id", context.userId)
      .maybeSingle();
    const learning = toLearningProfile(rawLearning);

    const openai = getOpenAI();
    const completion = await openai.chat.completions.parse({
      model: analysisModel,
      response_format: zodResponseFormat(analysisSchema, "seitai_analysis"),
      messages: [
        { role: "system", content: analysisSystemPrompt },
        { role: "user", content: buildAnalysisPrompt(transcript, buildLearningContext(learning)) }
      ]
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      return NextResponse.json({ error: "AI分析結果が空でした。" }, { status: 502 });
    }

    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .insert({
        organization_id: context.organizationId,
        clinic_id: context.clinicId,
        staff_id: context.userId,
        original_file_name: fileName || null,
        transcript,
        edited_transcript: transcript,
        memo: memo || null,
        status: "follow_up"
      })
      .select("id")
      .single();
    if (recordingError || !recording) throw new Error("添削履歴を保存できませんでした。");

    const { error: analysisError } = await supabase.from("ai_analyses").insert({
      recording_id: recording.id,
      organization_id: context.organizationId,
      model: analysisModel,
      overall_score: parsed.overallScore,
      contract_probability: parsed.contractPrediction.probability,
      improved_probability: parsed.contractPrediction.improvedProbability,
      patient_type: parsed.patientType.primary,
      result: parsed
    });
    if (analysisError) throw new Error("AI分析結果を保存できませんでした。");

    const nextLearning = updateLearningProfile(learning, parsed);
    await supabase.from("staff_learning_profiles").upsert({
      organization_id: context.organizationId,
      clinic_id: context.clinicId,
      staff_id: context.userId,
      total_analyses: nextLearning.totalAnalyses,
      average_score: nextLearning.averageScore,
      average_contract_probability: nextLearning.averageContractProbability,
      repeated_weaknesses: nextLearning.repeatedWeaknesses,
      last_next_focus: nextLearning.lastNextFocus,
      summary: nextLearning.repeatedWeaknesses.slice(0, 3).map((item) => item.text).join("、"),
      updated_at: nextLearning.lastUpdated
    }, { onConflict: "staff_id" });

    return NextResponse.json({ analysis: parsed, recordingId: recording.id, learning: nextLearning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI分析に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function toLearningProfile(value: unknown): LearningProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    totalAnalyses: Number(row.total_analyses ?? 0),
    averageScore: Number(row.average_score ?? 0),
    averageContractProbability: Number(row.average_contract_probability ?? 0),
    repeatedWeaknesses: Array.isArray(row.repeated_weaknesses)
      ? row.repeated_weaknesses as LearningProfile["repeatedWeaknesses"]
      : [],
    lastNextFocus: Array.isArray(row.last_next_focus) ? row.last_next_focus as string[] : [],
    lastUpdated: String(row.updated_at ?? new Date().toISOString())
  };
}
