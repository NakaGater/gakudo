import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InviteResultBanner } from "./invite-form";

// invite-form imports the Server Action from `./actions`. Mock at the
// boundary so this component test doesn't need Supabase / Resend / cookies.
vi.mock("./actions", () => ({
  inviteUser: vi.fn(),
}));

afterEach(() => cleanup());

// InviteResultBanner is the testable piece of the optimistic invite
// feedback. It was extracted so we can drive each visible state shape
// directly without going through useTransition's async machinery —
// jsdom can't reliably reproduce that, and our E2E used to hit a 30s
// timeout because Next 16 Server Action responses include the full
// page's RSC payload.
describe("InviteResultBanner", () => {
  it("renders nothing when state is null", () => {
    const { container } = render(<InviteResultBanner state={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the success message styled as success", () => {
    render(<InviteResultBanner state={{ success: true, message: "招待メールを送信しました" }} />);
    const msg = screen.getByText("招待メールを送信しました");
    expect(msg.className).toContain("text-success");
    expect(msg.className).not.toContain("text-danger");
  });

  it("falls back to a default success copy if the action returned no message", () => {
    // The optimistic banner sets { success: true, message: "招待メールを送信しました" }
    // immediately on click; if the action returns success with an empty
    // message, we still want the user to see *something* useful.
    render(<InviteResultBanner state={{ success: true, message: "" }} />);
    expect(screen.getByText("招待メールを送信しました")).toBeInTheDocument();
  });

  it("renders the action's error message styled as danger", () => {
    render(<InviteResultBanner state={{ success: false, message: "メールアドレスが無効です" }} />);
    const msg = screen.getByText("メールアドレスが無効です");
    expect(msg.className).toContain("text-danger");
    expect(msg.className).not.toContain("text-success");
  });
});
