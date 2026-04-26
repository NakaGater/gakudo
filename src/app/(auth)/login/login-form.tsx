import Link from "next/link";
import { login } from "./actions";

export function LoginForm({ error }: { error?: string | undefined }) {
  return (
    <div className="book-cover animate-pop-in">
      {/* Header with star */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-star rounded-full mb-3 border-3 border-star-gold shadow-[0_4px_12px_rgba(255,217,61,.35)] text-2xl animate-float">
          ⭐
        </div>
        <h1
          className="font-story text-[22px] font-black text-white"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,.2)", letterSpacing: ".06em" }}
        >
          星ヶ丘こどもクラブ
        </h1>
        <p className="text-xs text-white/70 font-story mt-1">保護者・職員ログイン</p>
      </div>

      {/* Form */}
      <div className="book-cover__form">
        <form action={login} className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-star text-center font-bold">
              メールアドレスまたはパスワードが正しくありません
            </p>
          )}
          <button type="submit" className="btn-star mt-2">
            ログイン
          </button>
        </form>
      </div>

      {/* Forgot password */}
      <div className="text-center mt-3.5">
        <Link
          href="/forgot-password"
          className="text-xs text-white/65 hover:text-star-gold transition-colors no-underline"
        >
          パスワードをお忘れですか？
        </Link>
      </div>

      {/* Welcome message */}
      <div className="book-cover__welcome">✨ おかえりなさい！きょうもいちにちたのしもうね ✨</div>
    </div>
  );
}
