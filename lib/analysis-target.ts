import type { SupabaseClient } from "@supabase/supabase-js";
import { canManage, type AuthContext } from "@/lib/auth";

export type AnalysisTarget = {
  staffId: string;
  clinicId: string;
  staffName: string;
  clinicName: string;
};

export class AnalysisTargetError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

export async function resolveAnalysisTarget(
  supabase: SupabaseClient,
  context: AuthContext,
  requestedStaffId?: string,
  requestedClinicId?: string
): Promise<AnalysisTarget> {
  const staffId = requestedStaffId?.trim() || context.userId;
  const clinicId = requestedClinicId?.trim() || context.clinicId;

  if (!canManage(context.role) && (staffId !== context.userId || clinicId !== context.clinicId)) {
    throw new AnalysisTargetError("他のスタッフの添削を行う権限がありません。", 403);
  }

  const [{ data: rawProfile }, { data: rawClinic }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, clinic_id, full_name, is_active")
      .eq("id", staffId)
      .eq("organization_id", context.organizationId)
      .maybeSingle(),
    supabase
      .from("clinics")
      .select("id, name")
      .eq("id", clinicId)
      .eq("organization_id", context.organizationId)
      .maybeSingle()
  ]);

  const profile = rawProfile as { id: string; clinic_id: string | null; full_name: string; is_active: boolean } | null;
  const clinic = rawClinic as { id: string; name: string } | null;
  if (!profile?.is_active) throw new AnalysisTargetError("選択したスタッフは利用できません。");
  if (!clinic) throw new AnalysisTargetError("選択した店舗が見つかりません。");
  if (profile.clinic_id !== clinic.id) {
    throw new AnalysisTargetError("スタッフの所属店舗と選択した店舗が一致しません。");
  }

  return {
    staffId: profile.id,
    clinicId: clinic.id,
    staffName: profile.full_name,
    clinicName: clinic.name
  };
}
