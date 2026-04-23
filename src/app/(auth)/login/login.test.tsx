import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LoginForm } from "./login-form";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("./actions", () => ({
  login: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  it("renders email and password inputs", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveAttribute(
      "type",
      "email",
    );

    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("renders submit button", () => {
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: "ログイン" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("renders forgot password link", () => {
    render(<LoginForm />);

    const link = screen.getByRole("link", {
      name: "パスワードをお忘れですか？",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/forgot-password");
  });

  it("shows error message when error param present", () => {
    render(<LoginForm error="invalid_credentials" />);

    expect(
      screen.getByText("メールアドレスまたはパスワードが正しくありません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("alert"),
    ).toBeInTheDocument();
  });

  it("does not show error message when no error", () => {
    render(<LoginForm />);

    expect(
      screen.queryByText("メールアドレスまたはパスワードが正しくありません"),
    ).not.toBeInTheDocument();
  });
});
