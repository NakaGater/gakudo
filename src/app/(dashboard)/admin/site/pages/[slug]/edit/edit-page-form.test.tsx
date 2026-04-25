import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EditPageForm } from "./edit-page-form";

// Mock server action — only the I/O boundary; React's useActionState runs unmocked.
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
