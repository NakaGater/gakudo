"use client";

import { useEffect, useState } from "react";

type Props = {
  type: "enter" | "exit";
  childName: string;
  recordedAt: string;
  onDismiss: () => void;
};

const enterMessages = [
  "おかえりなさい！きょうも たのしく すごそうね ⭐",
  "まってたよ！いっしょに あそぼう ⭐",
  "おかえり！きょうは なにして あそぶ？ ⭐",
];
const exitMessages = [
  "きをつけて かえってね！また あした ⭐",
  "バイバイ！また あしたね ⭐",
  "おつかれさま！ゆっくり やすんでね ⭐",
];

export function AttendanceResult({ type, childName, recordedAt, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => onDismiss(), 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const label = type === "enter" ? "入室しました" : "退室しました";
  const stClass = type === "enter" ? "res-st--in" : "res-st--out";
  const msgs = type === "enter" ? enterMessages : exitMessages;
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  const time = new Date(recordedAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`res-ov ${visible ? "show" : ""}`}
      onClick={onDismiss}
    >
      <div className="res-card" onClick={(e) => e.stopPropagation()}>
        {/* 星ちゃん celebrating */}
        <div className={`res-hoshi ${type === "enter" ? "res-hoshi--in" : ""}`}>
          <svg width="48" height="56" viewBox="0 0 32 38" aria-hidden>
            <path d="M16 2l3.5 10.5H30l-8.5 6.5 3.2 10L16 22.5 7.3 29l3.2-10L2 12.5h10.5z" fill="#FFD93D" stroke="#E8B830" strokeWidth="1.5"/>
            <circle cx="12" cy="14" r="1.5" fill="#3B2F20"/><circle cx="20" cy="14" r="1.5" fill="#3B2F20"/>
            <circle cx="9" cy="17" r="2" fill="#FFB5C5" opacity=".55"/><circle cx="23" cy="17" r="2" fill="#FFB5C5" opacity=".55"/>
            <path d="M11 17 Q16 23 21 17" fill="none" stroke="#3B2F20" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="5" y1="14" x2="0" y2="8" stroke="#E8B830" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="27" y1="14" x2="32" y2="8" stroke="#E8B830" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="res-name">{childName}</div>
        <div className={`res-st ${stClass}`}>{label}</div>
        <div className="res-time">{time}</div>
        <div className="res-msg">{msg}</div>
      </div>
    </div>
  );
}
