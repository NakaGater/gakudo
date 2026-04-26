import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { LogoutButton } from "./logout-button";
import { ProfileForm } from "./profile-form";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("./actions", () => ({
  updateProfile: vi.fn(),
  logout: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

const defaultUser = {
  id: "u1",
  email: "taro@example.com",
  name: "山田太郎",
  role: "parent" as const,
};

describe("ProfileForm", () => {
  it("renders user name and email", () => {
    render(<ProfileForm user={defaultUser} />);

    expect(screen.getByDisplayValue("taro@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("山田太郎")).toBeInTheDocument();
  });

  it("renders name input for editing", () => {
    render(<ProfileForm user={defaultUser} />);

    const nameInput = screen.getByLabelText("名前");
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("name", "name");
    expect(nameInput).not.toBeDisabled();
  });

  it("renders save button", () => {
    render(<ProfileForm user={defaultUser} />);

    const button = screen.getByRole("button", { name: "保存" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("renders role as badge", () => {
    render(<ProfileForm user={{ ...defaultUser, role: "admin" }} />);

    expect(screen.getByText("管理者")).toBeInTheDocument();
  });

  it("displays email as read-only", () => {
    render(<ProfileForm user={defaultUser} />);

    const emailInput = screen.getByLabelText("メールアドレス");
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue("taro@example.com");
  });

  it("shows success message when success prop is true", () => {
    render(<ProfileForm user={defaultUser} success />);

    expect(screen.getByText("保存しました")).toBeInTheDocument();
  });

  it("does not show success message by default", () => {
    render(<ProfileForm user={defaultUser} />);

    expect(screen.queryByText("保存しました")).not.toBeInTheDocument();
  });
});

describe("LogoutButton", () => {
  // Regression: an earlier client-side `onClick` implementation called
  // `supabase.auth.signOut() + window.location` which couldn't reliably
  // clear server-managed auth cookies. Lock down the structure so any
  // future rewrite must keep the form-action shape (Server Action).
  it("renders a submit button inside a form (Server Action)", () => {
    const { container } = render(<LogoutButton />);
    const btn = screen.getByRole("button", { name: /ログアウト/ });
    expect(btn.getAttribute("type")).toBe("submit");
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(form).toContainElement(btn);
  });
});
