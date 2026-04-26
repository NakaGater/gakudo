import { LogOut } from "lucide-react";
import { logout } from "./actions";

/**
 * Server Action form: clicking "ログアウト" submits a POST that runs
 * `logout()` on the server. This is the only reliable way to clear
 * Supabase's server-managed auth cookies — see actions.ts.
 *
 * Server-action button (no "use client" needed) — the form submission
 * is a native browser navigation, so it works even if JS is disabled
 * and isn't subject to the client-cookie clearing race that broke the
 * old `supabase.auth.signOut() + window.location` approach.
 */
export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-bg-elev px-4 py-3 text-sm text-cr-red hover:bg-cr-red/10 transition-colors"
      >
        <LogOut size={16} strokeWidth={1.75} />
        ログアウト
      </button>
    </form>
  );
}
