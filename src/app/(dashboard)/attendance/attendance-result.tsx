"use client";

import { useEffect, useState } from "react";

type Props = {
  type: "enter" | "exit";
  childName: string;
  recordedAt: string;
  onDismiss: () => void;
};

export function AttendanceResult({ type, childName, recordedAt, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = type === "enter" ? "bg-[#15803D]" : "bg-[#B91C1C]";
  const label = type === "enter" ? "入室しました" : "退室しました";

  const time = new Date(recordedAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgColor} text-white transition-opacity duration-250 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={onDismiss}
    >
      <p className="text-5xl font-bold mb-4">{childName}</p>
      <p className="text-3xl mb-2">{label}</p>
      <p className="text-2xl opacity-80">{time}</p>
    </div>
  );
}
