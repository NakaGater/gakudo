"use client";

import QRCode from "react-qr-code";

export type QRDisplayProps = {
  value: string;
  childName: string;
  grade: number;
  size?: number;
};

export function QRDisplay({ value, childName, grade, size = 200 }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <QRCode value={value} size={size} level="M" />
      <div className="text-center space-y-1">
        <p className="text-lg font-bold text-fg">{childName}</p>
        <p className="text-sm text-fg-muted">{grade}年</p>
        <p className="font-mono text-xs text-fg-muted">{value}</p>
      </div>
    </div>
  );
}
