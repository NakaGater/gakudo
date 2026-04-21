#!/bin/bash
# supabase db reset 後に管理者ユーザーを作成するスクリプト
# Usage: bash supabase/seed-auth.sh

set -euo pipefail

# .env.local から SERVICE_ROLE_KEY を取得
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2-)

echo "🔧 管理者ユーザーを作成中..."

RESPONSE=$(curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "email_confirm": true,
    "user_metadata": {"name": "管理者"}
  }')

USER_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -z "$USER_ID" ]; then
  echo "❌ ユーザー作成に失敗しました"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Auth ユーザー作成完了: $USER_ID"

# profiles テーブルにも追加
curl -s -X POST "http://127.0.0.1:54321/rest/v1/profiles" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"id\": \"$USER_ID\",
    \"email\": \"admin@example.com\",
    \"name\": \"管理者\",
    \"role\": \"admin\"
  }"

echo "✅ プロフィール作成完了"
echo ""
echo "📧 Email: admin@example.com"
echo "🔑 Password: password123"
