import { NextResponse } from "next/server";
import { canManage, getAuthContext } from "@/lib/auth";
import type { AnalysisResult } from "@/lib/types";

type RecordingRow = {
  id: string;
  clinic_id: string;
  staff_id: string;
  transcript: string | null;
  edited_transcript: string | null;
  memo: string | null;
  status: "contracted" | "lost" | "follow_up";
  lost_reason: string | null;
  created_at: string;
};

export async function GET() {
  const { supabase, context } = await getAuthContext();
  if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: rawRecordings, error } = await supabase
    .from("recordings")
    .select("id, clinic_id, staff_id, transcript, edited_transcript, memo, status, lost_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: "履歴を取得できませんでした。" }, { status: 500 });

  const recordings = (rawRecordings ?? []) as RecordingRow[];
  const recordingIds = recordings.map((item) => item.id);
  const staffIds = [...new Set(recordings.map((item) => item.staff_id))];
  const clinicIds = [...new Set(recordings.map((item) => item.clinic_id))];

  const [analysesResult, profilesResult, clinicsResult] = await Promise.all([
    recordingIds.length
      ? supabase.from("ai_analyses").select("recording_id, result").in("recording_id", recordingIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [], error: null }),
    clinicIds.length
      ? supabase.from("clinics").select("id, name").in("id", clinicIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const analyses = new Map((analysesResult.data ?? []).map((row) => [String(row.recording_id), row.result as AnalysisResult]));
  const profiles = new Map((profilesResult.data ?? []).map((row) => [String(row.id), String(row.full_name)]));
  const clinics = new Map((clinicsResult.data ?? []).map((row) => [String(row.id), String(row.name)]));

  const items = recordings.flatMap((recording) => {
    const analysis = analyses.get(recording.id);
    if (!analysis) return [];
    return [{
      id: recording.id,
      staffName: profiles.get(recording.staff_id) ?? "スタッフ",
      clinicName: clinics.get(recording.clinic_id) ?? "所属店舗",
      source: "ai" as const,
      transcript: recording.edited_transcript ?? recording.transcript ?? "",
      memo: recording.memo ?? undefined,
      status: recording.status,
      lostReason: recording.lost_reason ?? undefined,
      analysis,
      createdAt: recording.created_at
    }];
  });

  return NextResponse.json({ items, canDelete: canManage(context.role), role: context.role });
}

export async function PATCH(request: Request) {
  const { supabase, context } = await getAuthContext();
  if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const body = await request.json();
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  const allowed = ["contracted", "lost", "follow_up"];
  if (!id || !allowed.includes(status)) return NextResponse.json({ error: "入力が不正です。" }, { status: 400 });
  const lostReason = status === "lost" ? String(body.lostReason ?? "その他") : null;
  const { error } = await supabase.from("recordings").update({ status, lost_reason: lostReason, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "結果を更新できませんでした。" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { supabase, context } = await getAuthContext();
  if (!context || !canManage(context.role)) {
    return NextResponse.json({ error: "削除権限がありません。" }, { status: 403 });
  }
  const { error } = await supabase.from("recordings").delete().eq("organization_id", context.organizationId);
  if (error) return NextResponse.json({ error: "履歴を削除できませんでした。" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
