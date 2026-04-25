import { ForgotPasswordForm } from "./forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "パスワードリセット | 星ヶ丘こどもクラブ",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
