'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { scanAttendance } from '@/app/(protected)/teacher/attendance/actions'
import Link from 'next/link'

type ScanResult =
  | { success: true; studentName: string; action: 'checkin' | 'checkout' }
  | { success: false; error: string }

export function QrScanner() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current) return
    processingRef.current = true

    try {
      const res = await scanAttendance(decodedText)
      setResult(res)
    } catch {
      setResult({ success: false, error: 'スキャンに失敗しました' })
    }

    // Auto-reset after 3 seconds
    setTimeout(() => {
      setResult(null)
      processingRef.current = false
    }, 3000)
  }, [])

  useEffect(() => {
    const qrReader = document.getElementById('qr-reader')
    if (!qrReader) return

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText)
        },
        () => {
          // ignore scan errors (no QR found in frame)
        }
      )
      .then(() => setScanning(true))
      .catch(() => {
        // Camera access denied or unavailable
        setScanning(false)
      })

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [handleScan])

  const overlayBg = result
    ? result.success
      ? result.action === 'checkin'
        ? '#2D9D78'
        : '#3B82F6'
      : '#DC2626'
    : null

  const overlayText = result
    ? result.success
      ? result.action === 'checkin'
        ? `${result.studentName}\n入場しました`
        : `${result.studentName}\n退場しました`
      : result.error
    : null

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-gray-900">
      <div className="flex w-full items-center justify-between p-4">
        <Link
          href="/teacher/attendance"
          className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
        >
          ← 戻る
        </Link>
        <h1 className="text-lg font-bold text-white">QRスキャン</h1>
        <div className="w-20" />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div
          id="qr-reader"
          data-testid="qr-reader"
          className="w-80 max-w-full"
        />
      </div>

      {!scanning && !result && (
        <p className="absolute bottom-20 text-gray-400">
          カメラを起動中...
        </p>
      )}

      {result && overlayBg && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: overlayBg }}
          data-testid="scan-result-overlay"
        >
          <p className="whitespace-pre-line text-center text-3xl font-bold text-white">
            {overlayText}
          </p>
        </div>
      )}
    </div>
  )
}
