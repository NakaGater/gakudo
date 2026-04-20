"use client";

import { useEffect, useRef, useState } from "react";

export type QRScannerProps = {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
};

export function QRScanner({
  onScan,
  onError,
}: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const containerWidth = containerRef.current?.clientWidth ?? 480;
      const qrboxSize = Math.floor(containerWidth * 0.6);

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: qrboxSize, height: qrboxSize },
            aspectRatio: 1,
          },
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
    <div className="flex flex-col items-center gap-4 w-full" ref={containerRef}>
      <div className="w-full overflow-hidden rounded-xl">
        <div id="qr-reader" className="w-full" />
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-fg-muted">QRコードをスキャン中...</p>
      )}
    </div>
  );
}
