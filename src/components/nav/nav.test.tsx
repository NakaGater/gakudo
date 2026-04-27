import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { getNavItems } from "./nav-items";

// Mock next/navigation
const mockPathname = vi.fn<() => string>().mockReturnValue("/attendance/dashboard");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Sidebar logout uses the `logout` Server Action (form action). Mock
// the action so the component can render without a real Supabase
// client / cookies / redirect chain.
vi.mock("@/app/(dashboard)/profile/actions", () => ({
  logout: vi.fn(),
}));

const emptyBadgeCounts = { pendingInquiries: 0, unreadAnnouncements: 0 };

afterEach(() => {
  cleanup();
  mockPathname.mockReturnValue("/attendance/dashboard");
});

// ----- getNavItems unit tests -----
describe("getNavItems", () => {
  it("returns 5 items for parent role", () => {
    const items = getNavItems("parent");
    expect(items).toHaveLength(5);
    expect(items.map((i) => i.label)).toEqual(["入室状況", "連絡", "写真", "請求", "設定"]);
  });

  it("returns 7 items for teacher role", () => {
    const items = getNavItems("teacher");
    expect(items).toHaveLength(7);
    expect(items.map((i) => i.label)).toContain("児童管理");
    expect(items.map((i) => i.label)).toContain("お問い合わせ");
    expect(items.map((i) => i.label)).toContain("設定");
  });

  it("returns 9 items for admin role", () => {
    const items = getNavItems("admin");
    expect(items).toHaveLength(9);
    expect(items.map((i) => i.label)).toContain("ユーザー");
    expect(items.map((i) => i.label)).toContain("お問い合わせ");
    expect(items.map((i) => i.label)).toContain("HP管理");
    expect(items.map((i) => i.label)).toContain("設定");
  });
});

// ----- Sidebar component tests -----
describe("Sidebar", () => {
  let Sidebar: typeof import("./sidebar").Sidebar;

  beforeEach(async () => {
    const mod = await import("./sidebar");
    Sidebar = mod.Sidebar;
  });

  it("renders parent nav items (5 links)", () => {
    render(
      <Sidebar
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const links = screen.getAllByRole("link");
    // 5 nav items + 1 logo link + 1 profile link = 7 links starting with "/"
    expect(links.filter((l) => l.getAttribute("href")?.startsWith("/"))).toHaveLength(7);
  });

  it("renders teacher nav items (6 links)", () => {
    render(
      <Sidebar
        user={{ id: "2", email: "t@b.c", name: "鈴木先生", role: "teacher" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    expect(screen.getByText("児童管理")).toBeInTheDocument();
  });

  it("renders admin nav items (8 links)", () => {
    render(
      <Sidebar
        user={{ id: "3", email: "ad@b.c", name: "管理者", role: "admin" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    expect(screen.getByText("ユーザー")).toBeInTheDocument();
    expect(screen.getByText("HP管理")).toBeInTheDocument();
  });

  it("shows facility name", () => {
    render(
      <Sidebar
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    expect(screen.getByText("星ヶ丘こどもクラブ")).toBeInTheDocument();
  });

  it("shows user name and logout button", () => {
    render(
      <Sidebar
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ログアウト/ })).toBeInTheDocument();
  });

  // Regression: the logout button used to be `<button onClick={...}>` that
  // ran `supabase.auth.signOut() + window.location` on the client. That
  // pattern can't reliably clear server-managed Supabase auth cookies, so
  // the user appeared to "stay logged in". Now it must be a form
  // submission to the Server Action — verify that structurally so a
  // future "convenience" rewrite can't silently regress it.
  it("logout button submits a form (Server Action), not a client onClick", () => {
    const { container } = render(
      <Sidebar
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const logoutBtn = screen.getByRole("button", { name: /ログアウト/ });
    expect(logoutBtn.getAttribute("type")).toBe("submit");
    // Must be wrapped in a <form> — otherwise Server Action wiring is broken
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(form).toContainElement(logoutBtn);
  });

  it("applies active styling to current path", () => {
    mockPathname.mockReturnValue("/announcements");
    render(
      <Sidebar
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const announcementsLink = screen.getByRole("link", { name: /連絡/ });
    expect(announcementsLink.className).toContain("active");
  });

  it("does not apply active styling to non-current paths", () => {
    mockPathname.mockReturnValue("/announcements");
    render(
      <Sidebar
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const photosLink = screen.getByRole("link", { name: /写真/ });
    expect(photosLink.className).not.toContain("active");
  });
});

// ----- MobileTabs component tests -----
describe("MobileTabs", () => {
  let MobileTabs: typeof import("./mobile-tabs").MobileTabs;

  beforeEach(async () => {
    const mod = await import("./mobile-tabs");
    MobileTabs = mod.MobileTabs;
  });

  it("renders all 5 tab items for parent (no overflow)", () => {
    render(
      <MobileTabs
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
    // No "その他" button needed for 5 items
    expect(screen.queryByText("その他")).not.toBeInTheDocument();
  });

  it("renders 4 visible tabs + 'その他' button for admin", () => {
    render(
      <MobileTabs
        user={{ id: "3", email: "ad@b.c", name: "管理者", role: "admin" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("applies active styling to current tab", () => {
    mockPathname.mockReturnValue("/announcements");
    render(
      <MobileTabs
        user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );
    const announcementsLink = screen.getByRole("link", { name: /連絡/ });
    expect(announcementsLink.className).toContain("text-accent");
  });

  // Regression: the overflow panel that opens on the "その他" tab used to
  // be pinned with Tailwind's `bottom-14` (a fixed 56px). The bottom tab
  // bar itself is `h-14` PLUS `pb-[env(safe-area-inset-bottom)]`, which
  // on iPhones with a home indicator (~34px) makes the bar taller than
  // 56px — so the panel slipped under the bar's safe-area padding and
  // visually overlapped the lower row of nav items.
  //
  // The fix anchors the panel's bottom to the same safe-area-aware
  // formula. This test asserts the inline style explicitly so a future
  // refactor can't silently revert to a fixed pixel value.
  it("overflow panel position accounts for iOS safe-area-inset-bottom", () => {
    render(
      <MobileTabs
        user={{ id: "3", email: "ad@b.c", name: "管理者", role: "admin" }}
        badgeCounts={emptyBadgeCounts}
      />,
    );

    // Open the overflow panel
    fireEvent.click(screen.getByRole("button", { name: /その他/ }));

    // The panel header confirms the panel is now mounted
    expect(screen.getByText("メニュー")).toBeInTheDocument();

    // Locate the panel container — the closest ancestor of the menu
    // header that uses `absolute` positioning is the panel itself.
    const panel = screen.getByText("メニュー").closest('[class*="absolute"]') as HTMLElement | null;
    expect(panel).not.toBeNull();

    // Inline `bottom` must include env(safe-area-inset-bottom). A plain
    // "56px" or "3.5rem" without the env() expression would silently
    // resurrect the regression on iPhone X+ devices.
    const bottomStyle = panel!.style.bottom;
    expect(bottomStyle).toMatch(/env\(safe-area-inset-bottom\)/);
    // Sanity: the static portion still matches the bar's h-14 (3.5rem).
    expect(bottomStyle).toMatch(/3\.5rem/);
  });
});
