import { createClient } from "@/lib/supabase-server";
import type { UserRole } from "@/lib/types";

export type AuthContext = {
  userId: string;
  email: string;
  organizationId: string;
  clinicId: string;
  fullName: string;
  role: UserRole;
  clinicName: string;
};

type ProfileRow = {
  id: string;
  organization_id: string;
  clinic_id: string | null;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

export async function getAuthContext(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; context: AuthContext | null }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { supabase, context: null };

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("id, organization_id, clinic_id, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  const profile = rawProfile as ProfileRow | null;
  if (!profile?.is_active || !profile.clinic_id) return { supabase, context: null };

  const { data: rawClinic } = await supabase
    .from("clinics")
    .select("name")
    .eq("id", profile.clinic_id)
    .maybeSingle();
  const clinic = rawClinic as { name: string } | null;

  return {
    supabase,
    context: {
      userId: user.id,
      email: user.email ?? "",
      organizationId: profile.organization_id,
      clinicId: profile.clinic_id,
      fullName: profile.full_name,
      role: profile.role,
      clinicName: clinic?.name ?? "所属店舗"
    }
  };
}

export function canManage(role: UserRole) {
  return role === "owner" || role === "manager";
}
