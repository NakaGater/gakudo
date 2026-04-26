export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#B8A88A] px-4"
      style={{
        backgroundImage: `
          repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(0,0,0,0.015) 120px, rgba(0,0,0,0.015) 121px),
          repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.008) 50px, rgba(0,0,0,0.008) 51px)
        `,
      }}
    >
      {children}
    </div>
  );
}
