"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { forgotPassword, type ForgotPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(
    forgotPassword,
    {},
  );

  if (state.success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-bold text-center text-fg">メール送信完了</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fg-muted text-center">
            パスワードリセットメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-sm text-accent hover:underline"
          >
            ログインに戻る
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-bold text-center text-fg">
          パスワードをお忘れですか
        </h1>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted text-center">
            登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </p>
          <Input
            label="メールアドレス"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          {state.error && (
            <p role="alert" className="text-sm text-danger text-center">
              {state.error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={pending}
          >
            送信
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="text-sm text-accent hover:underline"
        >
          ログインに戻る
        </Link>
      </CardFooter>
    </Card>
  );
}
