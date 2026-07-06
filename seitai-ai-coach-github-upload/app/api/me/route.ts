import { NextResponse } from "next/server";
import { canManage, getAuthContext } from "@/lib/auth";
import { AnalysisTargetError, resolveAnalysisTarget } from "@/lib/analysis-target";

export async function GET(request: Request) {
  const { supabase, context } = await getAuthContext();
  if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const target = await resolveAnalysisTarget(
      supabase,
      context,
      url.searchParams.get("staffId") ?? undefined,
      url.searchParams.get("clinicId") ?? undefined
    );

    const selectionPromise = canManage(context.role)
      ? Promise.all([
          supabase
            .from("clinics")
            .select("id, name")
            .eq("organization_id", context.organizationId)
            .order("created_at"),
          supabase
            .from("profiles")
            .select("id, clinic_id, full_name, role")
            .eq("organization_id", context.organizationId)
            .eq("is_active", true)
            .order("full_name")
        ])
      : Promise.resolve([
          { data: [{ id: context.clinicId, name: context.clinicName }] },
          { data: [{ id: context.userId, clinic_id: context.clinicId, full_name: context.fullName, role: context.role }] }
        ]);

    const [{ data: learning }, selection] = await Promise.all([
      supabase
        .from("staff_learning_profiles")
        .select("total_analyses, average_score, average_contract_probability, repeated_weaknesses, last_next_focus, updated_at")
        .eq("staff_id", target.staffId)
        .maybeSingle(),
      selectionPromise
    ]);

    const row = learning as Record<string, unknown> | null;
    return NextResponse.json({
      profile: context,
      target,
      selection: {
        canSelect: canManage(context.role),
        clinics: selection[0].data ?? [],
        staff: selection[1].data ?? []
      },
      learning: row ? {
        totalAnalyses: Number(row.total_analyses ?? 0),
        averageScore: Number(row.average_score ?? 0),
        averageContractProbability: Number(row.average_contract_probability ?? 0),
        repeatedWeaknesses: Array.isArray(row.repeated_weaknesses) ? row.repeated_weaknesses : [],
        lastNextFocus: Array.isArray(row.last_next_focus) ? row.last_next_focus : [],
        lastUpdated: String(row.updated_at ?? "")
      } : null
    });
  } catch (error) {
    const status = error instanceof AnalysisTargetError ? error.status : 500;
    const message = error instanceof Error ? error.message : "プロフィールを取得できませんでした。";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const { supabase, context } = await getAuthContext();
  if (!context) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const target = await resolveAnalysisTarget(
      supabase,
      context,
      url.searchParams.get("staffId") ?? undefined,
      url.searchParams.get("clinicId") ?? undefined
    );
    const { error } = await supabase
      .from("staff_learning_profiles")
      .delete()
      .eq("organization_id", context.organizationId)
      .eq("staff_id", target.staffId);
    if (error) throw new Error("学習履歴をリセットできませんでした。");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AnalysisTargetError ? error.status : 500;
    const message = error instanceof Error ? error.message : "学習履歴をリセットできませんでした。";
    return NextResponse.json({ error: message }, { status });
  }
}
