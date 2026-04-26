"use client";

import Link from "next/link";
import { useState, useRef, useTransition, useCallback } from "react";
import { QRScanner } from "@/components/qr/qr-scanner";
import { recordAttendance } from "./actions";
import { AttendanceResult } from "./attendance-result";

type ResultData = {
  type: "enter" | "exit";
  childName: string;
  recordedAt: string;
};

export default function QrScannerPage() {
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const enterAudioRef = useRef<HTMLAudioElement>(null);
  const exitAudioRef = useRef<HTMLAudioElement>(null);
  const lastScannedRef = useRef<string>("");
  const cooldownRef = useRef(false);

  const processQrCode = useCallback((qrCode: string) => {
    if (!qrCode?.trim() || cooldownRef.current) return;
    if (qrCode === lastScannedRef.current) return;

    lastScannedRef.current = qrCode;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
      lastScannedRef.current = "";
    }, 3000);

    setError(null);
    startTransition(async () => {
      const res = await recordAttendance(qrCode.trim());
      if (res.success && res.childName && res.type && res.recordedAt) {
        setResult({
          type: res.type,
          childName: res.childName,
          recordedAt: res.recordedAt,
        });
        if (res.type === "enter") {
          enterAudioRef.current?.play().catch(() => {});
        } else {
          exitAudioRef.current?.play().catch(() => {});
        }
      } else {
        setError(res.message);
      }
    });
  }, []);

  const handleScan = useCallback(
    (decodedText: string) => {
      processQrCode(decodedText);
    },
    [processQrCode],
  );

  const handleCameraError = useCallback(() => {
    setCameraError(true);
    setScannerEnabled(false);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const qrCode = formData.get("qrCode") as string;
    if (!qrCode?.trim()) return;
    processQrCode(qrCode.trim());
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="qr-area">
      <h1 className="qr-area__t">📖 入退室管理</h1>
      <p className="qr-area__sub">QRコードをかざしてね ⭐</p>

      {/* QR Scanner */}
      {scannerEnabled ? (
        <div className="qr-frame" style={{ aspectRatio: "1", maxWidth: 320 }}>
          <QRScanner onScan={handleScan} onError={handleCameraError} />
          <div className="qr-frame__inner" />
          <div className="qr-frame__scan" />
        </div>
      ) : (
        <div className="qr-frame" style={{ aspectRatio: "1", maxWidth: 320 }}>
          <div className="qr-frame__inner" />
          <div className="qr-frame__hint">
            {cameraError ? "カメラにアクセスできません" : "スキャナーが停止中です"}
            <br />
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => {
                setCameraError(false);
                setScannerEnabled(true);
              }}
            >
              スキャナーを起動
            </button>
          </div>
        </div>
      )}

      {/* Manual input fallback */}
      <form onSubmit={handleSubmit} className="qr-input">
        <input
          ref={inputRef}
          name="qrCode"
          type="text"
          placeholder="QRコードを手動入力"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
          送信
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "var(--absent)", fontSize: 13, marginTop: 8 }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Link
          href="/attendance/manual"
          style={{ fontSize: 12, color: "var(--ink-light)", fontFamily: "var(--font-hand)" }}
        >
          ✏️ 手動入力ページへ
        </Link>
      </div>

      {/* Sound feedback placeholders */}
      <audio ref={enterAudioRef} preload="none" />
      <audio ref={exitAudioRef} preload="none" />

      {/* Result overlay */}
      {result && (
        <AttendanceResult
          type={result.type}
          childName={result.childName}
          recordedAt={result.recordedAt}
          onDismiss={() => setResult(null)}
        />
      )}
    </div>
  );
}
