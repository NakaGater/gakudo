/**
 * テストユーザー一括作成スクリプト
 *
 * 使い方:
 *   npx tsx scripts/seed-test-users.ts
 *
 * 環境変数 (.env.local から読み込み):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// .env.local を手動パース
const envPath = resolve(import.meta.dirname ?? ".", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && match[1] && match[2] !== undefined) env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PASSWORD = "Test1234!";

const testUsers = [
  { email: "test-admin@example.com", name: "テスト管理者", role: "admin" },
  { email: "test-teacher@example.com", name: "テスト先生", role: "teacher" },
  { email: "test-parent@example.com", name: "テスト保護者", role: "parent" },
  { email: "test-entrance@example.com", name: "テスト入口端末", role: "entrance" },
];

async function main() {
  console.log("🌱 テストユーザー作成開始...\n");

  for (const user of testUsers) {
    // 既存ユーザーチェック（emailで検索）
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("email", user.email)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  ${user.role.padEnd(8)} ${user.email} (既に存在)`);
      continue;
    }

    // Auth ユーザー作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      console.error(`❌ ${user.role} Auth作成失敗:`, authError.message);
      continue;
    }

    // Profile 作成
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    if (profileError) {
      console.error(`❌ ${user.role} Profile作成失敗:`, profileError.message);
      // Auth ユーザーをクリーンアップ
      await supabase.auth.admin.deleteUser(authData.user.id);
      continue;
    }

    console.log(`✅ ${user.role.padEnd(8)} ${user.email}`);
  }

  console.log(`\n📋 共通パスワード: ${TEST_PASSWORD}`);
  console.log("🏁 完了");
}

main().catch(console.error);
