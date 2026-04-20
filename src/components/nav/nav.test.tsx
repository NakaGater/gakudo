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
      "ホーム",
      "入退場",
      "連絡",
      "写真",
      "請求",
    ]);
  });

  it("returns 6 items for teacher role", () => {
    const items = getNavItems("teacher");
    expect(items).toHaveLength(6);
    expect(items.map((i) => i.label)).toContain("児童管理");
  });

  it("returns 8 items for admin role", () => {
    const items = getNavItems("admin");
    expect(items).toHaveLength(8);
    expect(items.map((i) => i.label)).toContain("ユーザー");
    expect(items.map((i) => i.label)).toContain("HP管理");
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
    // 5 nav items
    expect(links.filter((l) => l.getAttribute("href")?.startsWith("/"))).toHaveLength(5);
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
    mockPathname.mockReturnValue("/attendance/dashboard");
    render(
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const homeLink = screen.getByRole("link", { name: /ホーム/ });
    expect(homeLink.className).toContain("bg-accent-light");
    expect(homeLink.className).toContain("text-accent");
  });

  it("does not apply active styling to non-current paths", () => {
    mockPathname.mockReturnValue("/attendance/dashboard");
    render(
      <Sidebar user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const attendanceLink = screen.getByRole("link", { name: /入退場/ });
    expect(attendanceLink.className).not.toContain("bg-accent-light");
  });
});

// ----- MobileTabs component tests -----
describe("MobileTabs", () => {
  let MobileTabs: typeof import("./mobile-tabs").MobileTabs;

  beforeEach(async () => {
    const mod = await import("./mobile-tabs");
    MobileTabs = mod.MobileTabs;
  });

  it("renders max 5 tab items for parent", () => {
    render(
      <MobileTabs user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("renders max 5 tab items for admin (subset)", () => {
    render(
      <MobileTabs user={{ id: "3", email: "ad@b.c", name: "管理者", role: "admin" }} />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("applies active styling to current tab", () => {
    mockPathname.mockReturnValue("/attendance/dashboard");
    render(
      <MobileTabs user={{ id: "1", email: "a@b.c", name: "田中太郎", role: "parent" }} />,
    );
    const homeLink = screen.getByRole("link", { name: /ホーム/ });
    expect(homeLink.className).toContain("text-accent");
  });
});
