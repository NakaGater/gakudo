import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import type { Json } from '@/lib/supabase/types'

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
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { user, supabase } = auth

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    console.error('[push/subscribe] Failed to parse request body:', error)
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
  const { data: existing, error: selectError } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('subscription->>endpoint' as 'subscription', body.endpoint)

  if (selectError) {
    return NextResponse.json(
      { error: '登録状態の確認に失敗しました' },
      { status: 500 },
    )
  }

  if (existing && (existing as unknown[]).length > 0) {
    return NextResponse.json({ message: '既に登録済みです' }, { status: 200 })
  }

  const { error: insertError } = await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    subscription: body as unknown as Json,
  })

  if (insertError) {
    return NextResponse.json(
      { error: '登録に失敗しました' },
      { status: 500 },
    )
  }

  // Ensure notification preference is set to "push" (or keep "both" if already set)
  const { data: existingPref } = await supabase
    .from('notification_preferences')
    .select('method')
    .eq('user_id', user.id)
    .single()

  const currentMethod = (existingPref as { method: string } | null)?.method
  if (!currentMethod || currentMethod === 'off') {
    await supabase.from('notification_preferences').upsert({
      user_id: user.id,
      method: 'push',
    })
  } else if (currentMethod === 'email') {
    await supabase.from('notification_preferences').upsert({
      user_id: user.id,
      method: 'both',
    })
  }

  return NextResponse.json(
    { message: 'プッシュ通知を登録しました' },
    { status: 201 },
  )
}

export async function DELETE(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { user, supabase } = auth

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    console.error('[push/subscribe] Failed to parse DELETE request body:', error)
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

  const { error: deleteError } = await supabase.from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('subscription->>endpoint' as 'subscription', body.endpoint)

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
