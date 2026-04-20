export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">星ヶ丘こどもクラブ</p>
        </div>
        {children}
      </div>
    </div>
  );
}
