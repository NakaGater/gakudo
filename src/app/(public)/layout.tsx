import { AuthHashRedirect } from "./components/auth-hash-redirect";
import { Footer } from "./components/footer";
import { Header } from "./components/header";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="h-[100dvh] flex flex-col pb-5 px-4 sm:px-6 overflow-hidden"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        background: `#B8A88A`,
        backgroundImage: `
          repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(0,0,0,0.015) 120px, rgba(0,0,0,0.015) 121px),
          repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.008) 50px, rgba(0,0,0,0.008) 51px)
        `,
      }}
    >
      <AuthHashRedirect />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-30"
        style={{
          height: "env(safe-area-inset-top)",
          background: "#B8A88A",
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(0,0,0,0.015) 120px, rgba(0,0,0,0.015) 121px),
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.008) 50px, rgba(0,0,0,0.008) 51px)
          `,
        }}
      />
      <div className="book-page mx-auto flex flex-col flex-1 min-h-0 w-full">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
}
