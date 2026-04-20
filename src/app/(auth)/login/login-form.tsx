import { login } from "./actions";
import Link from "next/link";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui";

export function LoginForm({ error }: { error?: string }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-bold text-center text-fg">ログイン</h1>
      </CardHeader>
      <CardContent>
        <form action={login} className="flex flex-col gap-4">
          <Input
            label="メールアドレス"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Input
            label="パスワード"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {error && (
            <p role="alert" className="text-sm text-danger text-center">
              メールアドレスまたはパスワードが正しくありません
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full">
            ログイン
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/forgot-password"
          className="text-sm text-accent hover:underline"
        >
          パスワードをお忘れですか？
        </Link>
      </CardFooter>
    </Card>
  );
}
