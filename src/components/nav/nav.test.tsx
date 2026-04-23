import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { getNavItems } from "./nav-items";

// Mock next/navigation
const mockPathname = vi.fn<() => string>().mockReturnValue("/attendance/dashboard");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

afterEach(() => {
  cleanup();
  mockPathname.mockReturnValue("/attendance/dashboard");
});

// ----- getNavItems unit tests -----
describe("getNavItems", () => {
  it("returns 5 items for parent role", () => {
    const items = getNavItems("parent");
    expect(items).toHaveLength(5);
    expect(items.map((i) => i.label)).toEqual([
      "入室状況",
      "連絡",
      "写真",
      "請求",
      "設定",
    ]);
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
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const links = screen.getAllByRole("link");
    // 5 nav items + 1 logo link + 1 profile link = 7 links starting with "/"
    expect(links.filter((l) => l.getAttribute("href")?.startsWith("/"))).toHaveLength(7);
  });

  it("renders teacher nav items (6 links)", () => {
    render(
      <Sidebar user={{ id: "2", email: "t@b.c", name: "鈴木先生", role: "teacher" }} />,
    );
    expect(screen.getByText("児童管理")).toBeInTheDocument();
  });

  it("renders admin nav items (8 links)", () => {
    render(
      <Sidebar user={{ id: "3", email: "ad@b.c", name: "管理者", role: "admin" }} />,
    );
    expect(screen.getByText("ユーザー")).toBeInTheDocument();
    expect(screen.getByText("HP管理")).toBeInTheDocument();
  });

  it("shows facility name", () => {
    render(
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    expect(screen.getByText("星ヶ丘こどもクラブ")).toBeInTheDocument();
  });

  it("shows user name and logout button", () => {
    render(
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ログアウト/ })).toBeInTheDocument();
  });

  it("applies active styling to current path", () => {
    mockPathname.mockReturnValue("/announcements");
    render(
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const announcementsLink = screen.getByRole("link", { name: /連絡/ });
    expect(announcementsLink.className).toContain("active");
  });

  it("does not apply active styling to non-current paths", () => {
    mockPathname.mockReturnValue("/announcements");
    render(
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
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
      <MobileTabs user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
    // No "その他" button needed for 5 items
    expect(screen.queryByText("その他")).not.toBeInTheDocument();
  });

  it("renders 4 visible tabs + 'その他' button for admin", () => {
    render(
      <MobileTabs user={{ id: "3", email: "ad@b.c", name: "管理者", role: "admin" }} />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("applies active styling to current tab", () => {
    mockPathname.mockReturnValue("/announcements");
    render(
      <MobileTabs user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const announcementsLink = screen.getByRole("link", { name: /連絡/ });
    expect(announcementsLink.className).toContain("text-accent");
  });
});
