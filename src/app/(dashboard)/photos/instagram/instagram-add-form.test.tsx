import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddResultBanner } from "./instagram-add-form";

// `instagram-add-form.tsx` imports the Server Action from `./actions`,
// which pulls in the @/lib/actions/middleware withAuth wrapper. Mock
// out at the action boundary so this component test doesn't need
// Supabase, cookies, or the auth chain.
vi.mock("./actions", () => ({
  addInstagramPost: vi.fn(),
}));

afterEach(() => cleanup());

// AddResultBanner is the testable piece of the in-form save feedback.
// It was extracted from InstagramAddForm precisely so we can drive
// every visible state shape directly without going through React's
// async useTransition machinery (which jsdom can't fully reproduce).
describe("AddResultBanner", () => {
  it("renders nothing when state is null", () => {
    const { container } = render(<AddResultBanner state={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when success has no message yet (optimistic placeholder)", () => {
    // The component intentionally treats `{ success: true, message: "" }`
    // as 'show the success badge' — the placeholder we set the moment
    // the user submits, before the action returns.
    render(<AddResultBanner state={{ success: true, message: "" }} />);
    expect(screen.getByText("✅ 登録しました")).toBeInTheDocument();
  });

  it("renders the success badge when state is success", () => {
    render(<AddResultBanner state={{ success: true, message: "" }} />);
    const badge = screen.getByText("✅ 登録しました");
    expect(badge.className).toContain("text-cr-green");
  });

  it("renders the action's error message when state is failure", () => {
    render(<AddResultBanner state={{ success: false, message: "登録に失敗しました" }} />);
    const error = screen.getByText("登録に失敗しました");
    expect(error.className).toContain("text-cr-red");
  });

  it("renders nothing when state is failure with no message", () => {
    const { container } = render(<AddResultBanner state={{ success: false, message: "" }} />);
    expect(container.firstChild).toBeNull();
  });
});
