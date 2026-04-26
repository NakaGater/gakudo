"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "pulling" | "refreshing" | "snapback";

const THRESHOLD = 72;
const MAX_PULL = 120;
const RESISTANCE = 0.5;
const DIRECTION_SLOP = 6;
const REFRESH_HOLD_MS = 600;
const SNAPBACK_MS = 220;

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable === true;
}

/**
 * タッチ対象から祖先を辿り、スクロール可能な祖先が「これ以上上にスクロールできない」
 * 状態 (scrollTop === 0) であるかを確認する。途中の祖先がまだ上にスクロール余地を
 * 持つ場合、ユーザーはその要素を内側スクロールしようとしているので PTR を発火させない。
 */
function canActivateAtTop(target: EventTarget | null): boolean {
  let el = target instanceof Element ? (target as HTMLElement) : null;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const scrollable =
      (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
    if (scrollable && el.scrollTop > 0) return false;
    el = el.parentElement;
  }
  return window.scrollY <= 0;
}

export function PullToRefresh() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [pull, setPull] = useState(0);

  const startY = useRef(0);
  const startX = useRef(0);
  const tracking = useRef(false);
  const decided = useRef(false);
  const refreshing = useRef(false);
  const enabled = useRef(false);
  const pullRef = useRef(0);
  const snapbackTimer = useRef<number | null>(null);
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      // Safari iOS exposes a non-standard `navigator.standalone` boolean
      // for home-screen apps. Cast is intentional feature detection.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    enabled.current = standalone && hasTouch;

    if (!enabled.current) return;

    const setPullValue = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    const clearTimers = () => {
      if (snapbackTimer.current !== null) {
        window.clearTimeout(snapbackTimer.current);
        snapbackTimer.current = null;
      }
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing.current) return;
      if (e.touches.length !== 1) return;
      if (!canActivateAtTop(e.target)) return;
      if (isEditableElement(document.activeElement)) return;

      const t = e.touches[0];
      if (!t) return;
      startY.current = t.clientY;
      startX.current = t.clientX;
      tracking.current = true;
      decided.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current) return;
      if (e.touches.length !== 1) {
        tracking.current = false;
        return;
      }

      const t = e.touches[0];
      if (!t) return;
      const dy = t.clientY - startY.current;
      const dx = t.clientX - startX.current;

      if (!decided.current) {
        if (Math.abs(dy) < DIRECTION_SLOP && Math.abs(dx) < DIRECTION_SLOP) {
          return;
        }
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          tracking.current = false;
          return;
        }
        // touchstart 以降に内側スクロールで scrollTop が増えた可能性があるので
        // commit する直前に再確認する。
        if (!canActivateAtTop(e.target)) {
          tracking.current = false;
          return;
        }
        decided.current = true;
      }

      if (dy <= 0) return;

      e.preventDefault();
      const eased = Math.min(MAX_PULL, dy * RESISTANCE);
      setPullValue(eased);
      setPhase("pulling");
    };

    const finishGesture = () => {
      if (!tracking.current) return;
      tracking.current = false;
      decided.current = false;

      if (pullRef.current >= THRESHOLD && !refreshing.current) {
        refreshing.current = true;
        navigator.vibrate?.(8);
        setPhase("refreshing");
        setPullValue(THRESHOLD);
        router.refresh();

        refreshTimer.current = window.setTimeout(() => {
          refreshTimer.current = null;
          setPhase("snapback");
          setPullValue(0);
          snapbackTimer.current = window.setTimeout(() => {
            snapbackTimer.current = null;
            refreshing.current = false;
            setPhase("idle");
          }, SNAPBACK_MS);
        }, REFRESH_HOLD_MS);
      } else {
        setPhase("snapback");
        setPullValue(0);
        snapbackTimer.current = window.setTimeout(() => {
          snapbackTimer.current = null;
          setPhase("idle");
        }, SNAPBACK_MS);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", finishGesture, { passive: true });
    window.addEventListener("touchcancel", finishGesture, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", finishGesture);
      window.removeEventListener("touchcancel", finishGesture);
      clearTimers();
    };
  }, [router]);

  if (phase === "idle") return null;

  return <Indicator phase={phase} pull={pull} />;
}

function Indicator({ phase, pull }: { phase: Phase; pull: number }) {
  const progress = Math.min(1, pull / THRESHOLD);
  const ready = progress >= 1;
  const spinning = phase === "refreshing";
  const animated = phase === "snapback" || phase === "refreshing";
  const arcLen = Math.max(2, progress * 56);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 z-[9999] flex justify-center"
      style={{
        top: "env(safe-area-inset-top, 0px)",
        transform: `translate3d(0, ${pull}px, 0)`,
        opacity: spinning ? 1 : progress,
        transition: animated ? "transform 220ms ease-out, opacity 220ms ease-out" : "none",
      }}
    >
      <div className="mt-2 grid h-9 w-9 place-items-center rounded-full border border-page-edge bg-paper-warm shadow-[0_4px_12px_rgba(59,47,32,0.12)]">
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`}
          style={{
            transform: spinning ? undefined : `rotate(${progress * 270}deg)`,
            color: ready || spinning ? "var(--cr-orange)" : "var(--ink-mid)",
            transition: spinning ? undefined : "color 120ms ease-out",
          }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${arcLen} 56`}
            strokeLinecap="round"
          />
          <path
            d="M12 5 L15 8 L12 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
