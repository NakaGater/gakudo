import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "パスワードリセット | 星ヶ丘こどもクラブ",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
