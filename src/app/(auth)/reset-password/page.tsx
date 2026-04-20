import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "パスワード再設定 | 星ヶ丘こどもクラブ",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
