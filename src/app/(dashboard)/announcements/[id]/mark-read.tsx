"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markAsRead } from "../actions";

export function MarkRead({ announcementId }: { announcementId: string }) {
  const called = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    markAsRead(announcementId).then(() => router.refresh());
  }, [announcementId, router]);

  return null;
}
