"use client";

import { useEffect, useRef } from "react";
import { markAsRead } from "../actions";

export function MarkRead({ announcementId }: { announcementId: string }) {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    markAsRead(announcementId);
  }, [announcementId]);

  return null;
}
