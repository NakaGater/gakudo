"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-bg-elev px-4 py-3 text-sm text-cr-red hover:bg-cr-red/10 transition-colors"
    >
      <LogOut size={16} strokeWidth={1.75} />
      ログアウト
    </button>
  );
}
