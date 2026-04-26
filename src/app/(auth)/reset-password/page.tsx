import { ResetPasswordForm } from "./reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "パスワード再設定 | 星ヶ丘こどもクラブ",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
