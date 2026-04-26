"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status = "loading" | "unsupported" | "denied" | "enabled" | "disabled";

export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const computeStatus = async (): Promise<Status> => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        return "unsupported";
      }
      if (Notification.permission === "denied") return "denied";
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        return sub ? "enabled" : "disabled";
      } catch {
        return "disabled";
      }
    };

    computeStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        return;
      }
      if (permission !== "granted") {
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (res.ok) {
        setStatus("enabled");
        // Clear any dismissed prompt state
        try {
          localStorage.removeItem("push-prompt-dismissed");
        } catch {}
      }
    } catch (err) {
      console.error("Push enable failed:", err);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDisable = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Notify server to remove subscription
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
    } catch (err) {
      console.error("Push disable failed:", err);
    } finally {
      setBusy(false);
    }
  }, []);

  const statusConfig = {
    loading: { label: "確認中…", color: "text-ink-light" },
    unsupported: { label: "この端末では利用できません", color: "text-ink-light" },
    denied: { label: "ブラウザでブロックされています", color: "text-cr-red" },
    enabled: { label: "有効", color: "text-cr-green" },
    disabled: { label: "無効", color: "text-ink-light" },
  };

  const { label, color } = statusConfig[status];

  return (
    <Card className="max-w-lg id-card" style={{ maxWidth: 480 }}>
      <CardHeader>
        <h2 className="text-base font-bold text-ink font-story">🔔 通知設定</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink">プッシュ通知</span>
          <span className={`text-sm font-bold ${color}`}>{label}</span>
        </div>

        {status === "denied" && (
          <p className="text-xs text-ink-light">
            ブラウザの設定からこのサイトの通知許可を変更してください。
          </p>
        )}

        {status === "enabled" && (
          <Button variant="secondary" size="sm" loading={busy} onClick={handleDisable}>
            通知を無効にする
          </Button>
        )}

        {status === "disabled" && (
          <Button variant="primary" size="sm" loading={busy} onClick={handleEnable}>
            通知を有効にする
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
