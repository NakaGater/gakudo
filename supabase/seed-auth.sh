#!/bin/bash
# supabase db reset 後にテスト用ユーザーを作成するスクリプト
# Usage: bash supabase/seed-auth.sh

set -euo pipefail

# .env.local から SERVICE_ROLE_KEY を取得
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2-)

# ユーザー作成関数
create_user() {
  local EMAIL="$1"
  local PASSWORD="$2"
  local NAME="$3"
  local ROLE="$4"

  echo "🔧 ${NAME}（${ROLE}）を作成中..."

  RESPONSE=$(curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$EMAIL\",
      \"password\": \"$PASSWORD\",
      \"email_confirm\": true,
      \"user_metadata\": {\"name\": \"$NAME\"}
    }")

  USER_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

  if [ -z "$USER_ID" ]; then
    EXISTING=$(curl -s http://127.0.0.1:54321/auth/v1/admin/users \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "apikey: $SERVICE_KEY")
    USER_ID=$(echo "$EXISTING" | python3 -c "
import sys,json
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
for u in users:
    if u.get('email') == '$EMAIL':
        print(u['id']); break
" 2>/dev/null || echo "")
    if [ -z "$USER_ID" ]; then
      echo "❌ ${NAME} の作成・取得に失敗しました"
      return 1
    fi
    echo "  ✅ 既存のAuth ユーザーを使用: $USER_ID"
  else
    echo "  ✅ Auth ユーザー作成完了: $USER_ID"
  fi

  curl -s -o /dev/null -w "" -X POST "http://127.0.0.1:54321/rest/v1/profiles" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal,resolution=ignore-duplicates" \
    -d "{
      \"id\": \"$USER_ID\",
      \"email\": \"$EMAIL\",
      \"name\": \"$NAME\",
      \"role\": \"$ROLE\"
    }"
  echo "  ✅ プロフィール作成完了"
}

# --- ユーザー作成 ---
create_user "admin@example.com" "password123" "管理者テスト" "admin"
create_user "entrance@example.com" "password123" "入口端末" "entrance"
create_user "teacher@example.com" "password123" "先生テスト" "teacher"
create_user "parent@example.com" "password123" "保護者テスト" "parent"

echo ""
echo "=== テストアカウント ==="
echo "📧 管理者:   admin@example.com   / password123"
echo "📧 入口端末: entrance@example.com / password123"
echo "📧 先生:     teacher@example.com  / password123"
echo "📧 保護者:   parent@example.com   / password123"
