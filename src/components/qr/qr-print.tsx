"use client";

import { QRDisplay } from "./qr-display";

export type QRPrintProps = {
  value: string;
  childName: string;
  grade: number;
};

export function QRPrint({ value, childName, grade }: QRPrintProps) {
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-print-card, #qr-print-card * { visibility: visible !important; }
          #qr-print-card {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 148.5mm;
            height: 105mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid #ccc;
            padding: 16mm;
          }
        }
      `}</style>

      <div
        id="qr-print-card"
        className="flex flex-col items-center gap-6 p-8 border border-border rounded-lg bg-white"
      >
        <h2 className="text-xl font-bold text-fg">{childName}</h2>
        <QRDisplay value={value} childName={childName} grade={grade} size={180} />
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="mt-4 inline-flex items-center justify-center rounded-md font-medium transition-colors bg-accent text-white hover:bg-accent-hv h-10 px-4 text-base"
      >
        印刷
      </button>
    </>
  );
}
