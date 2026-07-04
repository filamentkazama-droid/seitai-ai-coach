import { NextResponse } from "next/server";
import { canManage, getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/types";

export async function GET() {
  const { supabase, context } = await getAuthContext();
  if (!context || !canManage(context.role)) return NextResponse.json({ error: "管理権限がありません。" }, { status: 403 });
  const [{ data: clinics }, { data: profiles }] = await Promise.all([
    supabase.from("clinics").select("id, name, address, created_at").eq("organization_id", context.organizationId).order("created_at"),
    supabase.from("profiles").select("id, clinic_id, full_name, role, is_active, created_at").eq("organization_id", context.organizationId).order("created_at")
  ]);
  return NextResponse.json({ clinics: clinics ?? [], profiles: profiles ?? [], currentRole: context.role });
}

export async function POST(request: Request) {
  const { supabase, context } = await getAuthContext();
  if (!context || !canManage(context.role)) return NextResponse.json({ error: "管理権限がありません。" }, { status: 403 });
  const body = await request.json();
  const action = String(body.action ?? "");

  if (action === "addClinic") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "店舗名を入力してください。" }, { status: 400 });
    const { error } = await supabase.from("clinics").insert({ organization_id: context.organizationId, name, address: String(body.address ?? "").trim() || null });
    if (error) return NextResponse.json({ error: "店舗を追加できませんでした。" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "invite") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    const clinicId = String(body.clinicId ?? "").trim();
    const role = (["manager", "staff"].includes(String(body.role)) ? String(body.role) : "staff") as UserRole;
    if (!email || !fullName || !clinicId) return NextResponse.json({ error: "氏名、メール、店舗を入力してください。" }, { status: 400 });
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/invite`,
      data: { organization_id: context.organizationId, clinic_id: clinicId, full_name: fullName, role }
    });
    if (error) return NextResponse.json({ error: `招待できませんでした: ${error.message}` }, { status: 500 });
    await supabase.from("staff_invitations").upsert({ organization_id: context.organizationId, clinic_id: clinicId, email, full_name: fullName, role, invited_by: context.userId }, { onConflict: "organization_id,email" });
    return NextResponse.json({ ok: true });
  }

  if (action === "changeRole") {
    if (context.role !== "owner") return NextResponse.json({ error: "権限変更はオーナーのみ可能です。" }, { status: 403 });
    const profileId = String(body.profileId ?? "");
    const role = String(body.role ?? "staff") as UserRole;
    if (!profileId || !["owner", "manager", "staff"].includes(role)) return NextResponse.json({ error: "入力が不正です。" }, { status: 400 });
    const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId).eq("organization_id", context.organizationId);
    if (error) return NextResponse.json({ error: "権限を変更できませんでした。" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "操作が不正です。" }, { status: 400 });
}
