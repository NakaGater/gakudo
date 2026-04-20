"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { QRScanner } from "@/components/qr/qr-scanner";
import { recordAttendance } from "./actions";
import { AttendanceResult } from "./attendance-result";

type ResultData = {
  type: "enter" | "exit";
  childName: string;
  recordedAt: string;
};

export default function AttendancePage() {
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

  const processQrCode = useCallback(
    (qrCode: string) => {
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
    },
    [],
  );

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
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col items-center min-h-[80vh]">
      <h1 className="text-2xl font-bold text-fg mb-8">入退室管理</h1>

      {/* QR Scanner */}
      {scannerEnabled ? (
        <div className="mb-6">
          <QRScanner
            onScan={handleScan}
            onError={handleCameraError}
            width={320}
            height={320}
          />
        </div>
      ) : (
        <div className="w-full max-w-sm aspect-square bg-bg-elev border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center mb-6 gap-3">
          <p className="text-fg-muted text-center px-4">
            {cameraError
              ? "カメラにアクセスできません"
              : "スキャナーが停止中です"}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setCameraError(false);
              setScannerEnabled(true);
            }}
          >
            スキャナーを起動
          </Button>
        </div>
      )}

      {/* Manual input fallback */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex gap-2 mb-6">
        <div className="flex-1">
          <Input
            ref={inputRef}
            name="qrCode"
            placeholder="QRコードを手動入力"
            autoComplete="off"
          />
        </div>
        <Button type="submit" loading={isPending}>
          送信
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-danger text-sm mb-4">{error}</p>
      )}

      <Link href="/attendance/manual" className="text-accent hover:text-accent-hv text-sm">
        手動入力ページへ
      </Link>

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
