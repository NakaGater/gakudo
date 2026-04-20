"use client";

import { useEffect, useRef, useState } from "react";

export type QRScannerProps = {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
};

export function QRScanner({
  onScan,
  onError,
  width = 300,
  height = 300,
}: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        if (cancelled) return;
        setError("カメラへのアクセスを許可してください");
        onError?.(String(err));
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current as {
        stop: () => Promise<void>;
      } | null;
      scanner?.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width, height }}>
        <div id="qr-reader" className="w-full h-full" />
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[250px] w-[250px] border-2 border-white/70 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
          </div>
        )}
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-fg-muted">QRコードをスキャン中...</p>
      )}
    </div>
  );
}
