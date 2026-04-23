"use client";

import { useEffect } from "react";

export function AuthHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      sessionStorage.setItem("__auth_hash", hash.substring(1));
      window.location.replace("/auth/callback");
    }
  }, []);

  return null;
}
