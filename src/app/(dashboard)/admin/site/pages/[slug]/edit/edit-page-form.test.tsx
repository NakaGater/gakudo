import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { EditPageForm, SaveResultBanner } from "./edit-page-form";

// Mock server action — only the I/O boundary; React's hooks run unmocked.
vi.mock("../../../actions", () => ({
  updateSitePage: vi.fn(),
}));

const baseProps = {
  title: "テスト",
  content: "テスト本文",
  metadata: {},
};

describe("EditPageForm", () => {
  afterEach(() => cleanup());
  it("renders AccessMetaFields when slug is 'access'", () => {
    render(<EditPageForm slug="access" {...baseProps} />);
    // access単独ページでもアクセス情報フィールドが表示される
    expect(screen.getByText("アクセス情報")).toBeInTheDocument();
  });

  it("renders HomeMetaFields with access fields when slug is 'home'", () => {
    render(<EditPageForm slug="home" {...baseProps} />);
    expect(screen.getByText("ヒーローセクション")).toBeInTheDocument();
    // ホームページにアクセス情報が統合されている
    expect(screen.getByText("アクセス情報")).toBeInTheDocument();
  });

  it("renders AboutMetaFields when slug is 'about'", () => {
    render(<EditPageForm slug="about" {...baseProps} />);
    expect(screen.getByText("理念セクション")).toBeInTheDocument();
  });

  it("does not render AccessMetaFields for about slug", () => {
    render(<EditPageForm slug="about" {...baseProps} />);
    expect(screen.queryByText("アクセス情報")).not.toBeInTheDocument();
  });

  it("renders common fields for all slugs", () => {
    render(<EditPageForm slug="access" {...baseProps} />);
    expect(screen.getByLabelText("サブタイトル")).toBeInTheDocument();
    expect(screen.getByLabelText("本文")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "保存する" }).length).toBeGreaterThan(0);
  });
});

// SaveResultBanner is the testable piece of the in-form save feedback.
// We extracted it from EditPageForm precisely so we can drive every
// possible state shape directly without going through useTransition's
// async machinery (which jsdom can't fully reproduce in a deterministic
// way, and which the E2E flow18/19 used to rely on with a 30s timeout).
describe("SaveResultBanner", () => {
  afterEach(() => cleanup());

  it("renders nothing when there is no state", () => {
    const { container } = render(<SaveResultBanner state={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when state has no message", () => {
    const { container } = render(<SaveResultBanner state={{ success: true, message: "" }} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 保存しました with success styling for a successful save", () => {
    render(<SaveResultBanner state={{ success: true, message: "保存しました" }} />);
    const banner = screen.getByRole("alert");
    expect(banner.textContent).toBe("保存しました");
    expect(banner.className).toContain("text-success");
    expect(banner.className).not.toContain("text-danger");
  });

  it("renders the action's error message with danger styling on failure", () => {
    render(<SaveResultBanner state={{ success: false, message: "保存に失敗しました" }} />);
    const banner = screen.getByRole("alert");
    expect(banner.textContent).toBe("保存に失敗しました");
    expect(banner.className).toContain("text-danger");
    expect(banner.className).not.toContain("text-success");
  });
});
