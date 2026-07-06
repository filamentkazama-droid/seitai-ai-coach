import { NextResponse } from "next/server";
import { canManage, getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/types";

async function findUserByEmail(email: string) {
  const admin = createAdminClient();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 100) break;
  }

  return null;
}

export async function GET() {
  const { supabase, context } = await getAuthContext();
  if (!context || !canManage(context.role)) return NextResponse.json({ error: "管理権限がありません。" }, { status: 403 });
  const [{ data: organization }, { data: clinics }, { data: profiles }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", context.organizationId).single(),
    supabase.from("clinics").select("id, name, address, created_at").eq("organization_id", context.organizationId).order("created_at"),
    supabase.from("profiles").select("id, clinic_id, full_name, role, is_active, created_at").eq("organization_id", context.organizationId).order("created_at")
  ]);
  return NextResponse.json({ organization, clinics: clinics ?? [], profiles: profiles ?? [], currentRole: context.role, currentUserId: context.userId });
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

    const { data: clinic } = await admin.from("clinics").select("id").eq("id", clinicId).eq("organization_id", context.organizationId).maybeSingle();
    if (!clinic) return NextResponse.json({ error: "招待先の店舗が見つかりません。" }, { status: 400 });

    try {
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        const { data: existingProfile } = await admin.from("profiles").select("organization_id, is_active").eq("id", existingUser.id).maybeSingle();
        if (existingProfile && existingProfile.organization_id !== context.organizationId) {
          return NextResponse.json({ error: "このメールアドレスは別の組織で使用されています。" }, { status: 409 });
        }
        if (!existingProfile) {
          return NextResponse.json({ error: "このメールアドレスは登録済みですが、所属組織を確認できません。別のメールアドレスを使用してください。" }, { status: 409 });
        }
        if (existingProfile.is_active === false) {
          return NextResponse.json({ error: "このスタッフは利用停止中です。スタッフ一覧から復元してください。" }, { status: 409 });
        }

        const now = new Date();
        const { error: profileError } = await admin.from("profiles").update({
          full_name: fullName,
          clinic_id: clinicId,
          role,
          updated_at: now.toISOString()
        }).eq("id", existingUser.id).eq("organization_id", context.organizationId);
        if (profileError) return NextResponse.json({ error: "スタッフ情報を更新できませんでした。" }, { status: 500 });

        const { error: metadataError } = await admin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            organization_id: context.organizationId,
            clinic_id: clinicId,
            full_name: fullName,
            role
          }
        });
        if (metadataError) return NextResponse.json({ error: `スタッフ情報を更新できませんでした: ${metadataError.message}` }, { status: 500 });

        const { error: recoveryError } = await admin.auth.resetPasswordForEmail(email, {
          redirectTo: `${new URL(request.url).origin}/auth/callback?next=/invite`
        });
        if (recoveryError) return NextResponse.json({ error: `再設定メールを送信できませんでした: ${recoveryError.message}` }, { status: 500 });

        await admin.from("staff_invitations").upsert({
          organization_id: context.organizationId,
          clinic_id: clinicId,
          email,
          full_name: fullName,
          role,
          invited_by: context.userId,
          accepted_at: null,
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: "organization_id,email" });

        return NextResponse.json({ ok: true, message: "登録済みスタッフへパスワード設定メールを再送しました。" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ユーザー情報を確認できませんでした。";
      return NextResponse.json({ error: `招待を確認できませんでした: ${message}` }, { status: 500 });
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/invite`,
      data: { organization_id: context.organizationId, clinic_id: clinicId, full_name: fullName, role }
    });
    if (error) return NextResponse.json({ error: `招待できませんでした: ${error.message}` }, { status: 500 });
    await supabase.from("staff_invitations").upsert({ organization_id: context.organizationId, clinic_id: clinicId, email, full_name: fullName, role, invited_by: context.userId, accepted_at: null, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }, { onConflict: "organization_id,email" });
    return NextResponse.json({ ok: true, message: "招待メールを送信しました。" });
  }

  if (action === "setProfileActive") {
    if (context.role !== "owner") return NextResponse.json({ error: "スタッフの削除・復元はオーナーのみ可能です。" }, { status: 403 });
    const profileId = String(body.profileId ?? "").trim();
    const isActive = body.isActive === true;
    if (!profileId) return NextResponse.json({ error: "スタッフが指定されていません。" }, { status: 400 });
    if (profileId === context.userId && !isActive) return NextResponse.json({ error: "自分自身は削除できません。" }, { status: 400 });

    const admin = createAdminClient();
    const { data: target } = await admin.from("profiles").select("id, role").eq("id", profileId).eq("organization_id", context.organizationId).maybeSingle();
    if (!target) return NextResponse.json({ error: "スタッフが見つかりません。" }, { status: 404 });
    if (target.role === "owner" && !isActive) return NextResponse.json({ error: "オーナーは削除できません。先に権限を変更してください。" }, { status: 400 });

    const { error } = await admin.from("profiles").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", profileId).eq("organization_id", context.organizationId);
    if (error) return NextResponse.json({ error: isActive ? "スタッフを復元できませんでした。" : "スタッフを削除できませんでした。" }, { status: 500 });
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

  if (action === "updateOrganization") {
    if (context.role !== "owner") return NextResponse.json({ error: "組織名の変更はオーナーのみ可能です。" }, { status: 403 });
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "組織名を入力してください。" }, { status: 400 });
    const admin = createAdminClient();
    const { error } = await admin.from("organizations").update({ name }).eq("id", context.organizationId);
    if (error) return NextResponse.json({ error: "組織名を変更できませんでした。" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "updateClinic") {
    if (context.role !== "owner") return NextResponse.json({ error: "店舗情報の変更はオーナーのみ可能です。" }, { status: 403 });
    const clinicId = String(body.clinicId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const address = String(body.address ?? "").trim() || null;
    if (!clinicId || !name) return NextResponse.json({ error: "店舗名を入力してください。" }, { status: 400 });
    const { error } = await supabase.from("clinics").update({ name, address }).eq("id", clinicId).eq("organization_id", context.organizationId);
    if (error) return NextResponse.json({ error: "店舗情報を変更できませんでした。" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "updateProfile") {
    if (context.role !== "owner") return NextResponse.json({ error: "スタッフ名の変更はオーナーのみ可能です。" }, { status: 403 });
    const profileId = String(body.profileId ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const clinicId = String(body.clinicId ?? "").trim();
    if (!profileId || !fullName || !clinicId) return NextResponse.json({ error: "氏名と所属店舗を入力してください。" }, { status: 400 });
    const clinicExists = await supabase.from("clinics").select("id").eq("id", clinicId).eq("organization_id", context.organizationId).maybeSingle();
    if (!clinicExists.data) return NextResponse.json({ error: "所属店舗が見つかりません。" }, { status: 400 });
    const { error } = await supabase.from("profiles").update({ full_name: fullName, clinic_id: clinicId, updated_at: new Date().toISOString() }).eq("id", profileId).eq("organization_id", context.organizationId);
    if (error) return NextResponse.json({ error: "スタッフ情報を変更できませんでした。" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "操作が不正です。" }, { status: 400 });
}
