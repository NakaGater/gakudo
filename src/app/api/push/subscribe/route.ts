import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PushSubscriptionBody {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

function isValidSubscription(body: unknown): body is PushSubscriptionBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.endpoint !== 'string' || !b.endpoint) return false
  if (!b.keys || typeof b.keys !== 'object') return false
  const keys = b.keys as Record<string, unknown>
  if (typeof keys.p256dh !== 'string' || !keys.p256dh) return false
  if (typeof keys.auth !== 'string' || !keys.auth) return false
  return true
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です' },
      { status: 400 },
    )
  }

  if (!isValidSubscription(body)) {
    return NextResponse.json(
      { error: 'endpoint と keys (p256dh, auth) が必要です' },
      { status: 400 },
    )
  }

  // Check for existing subscription
  const ps = supabase.from('push_subscriptions')
  const { data: existing, error: selectError } = await ps
    .select('id')
    .eq('user_id', user.id)
    .eq('endpoint', body.endpoint)

  if (selectError) {
    return NextResponse.json(
      { error: '登録状態の確認に失敗しました' },
      { status: 500 },
    )
  }

  if (existing && (existing as unknown[]).length > 0) {
    return NextResponse.json({ message: '既に登録済みです' }, { status: 200 })
  }

  const { error: insertError } = await ps.insert({
    user_id: user.id,
    subscription: body,
  })

  if (insertError) {
    return NextResponse.json(
      { error: '登録に失敗しました' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { message: 'プッシュ通知を登録しました' },
    { status: 201 },
  )
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です' },
      { status: 400 },
    )
  }

  if (!isValidSubscription(body)) {
    return NextResponse.json(
      { error: 'endpoint と keys (p256dh, auth) が必要です' },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await supabase.from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', body.endpoint)

  if (deleteError) {
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { message: 'プッシュ通知の登録を解除しました' },
    { status: 200 },
  )
}
