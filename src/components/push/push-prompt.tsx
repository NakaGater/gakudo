'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const DISMISSED_KEY = 'push-prompt-dismissed'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return
        if (Notification.permission === 'granted') return
        if (Notification.permission === 'denied') return
        if (localStorage.getItem(DISMISSED_KEY)) return
        setVisible(true)
      } catch (error) {
        console.error("[push-prompt] Failed to check notification state:", error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleEnable = useCallback(async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setVisible(false)
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key is not configured')
        setVisible(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!res.ok) {
        console.error('Failed to save push subscription')
      }
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setLoading(false)
      setVisible(false)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch (error) {
      console.error("[push-prompt] Failed to save dismissed state:", error);
      // localStorage may be unavailable
    }
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div className="mx-4 mt-4 rounded-lg border-2 border-orange-300 bg-orange-50 p-4 shadow-md">
      <p className="mb-3 text-sm font-medium text-orange-900">
        🔔 プッシュ通知を有効にすると、入退場やお知らせをリアルタイムで受け取れます
      </p>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={loading} onClick={handleEnable}>
          有効にする
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          後で
        </Button>
      </div>
    </div>
  )
}
