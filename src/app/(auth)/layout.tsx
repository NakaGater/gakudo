export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-page-deep to-page px-4">
      <div className="flex flex-col items-center gap-6">
        {/* Star mascot + facility name */}
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-star border-3 border-star-gold shadow-[3px_3px_0_var(--star-gold)] text-3xl animate-float">
            ⭐
          </div>
          <p className="text-2xl font-bold font-story text-ink">星ヶ丘こどもクラブ</p>
          <p className="mt-1 text-sm text-ink-light font-hand">みんなのえがおがいっぱい！</p>
        </div>
        {children}
      </div>
    </div>
  );
}
