import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { AuthHashRedirect } from "./components/auth-hash-redirect";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AuthHashRedirect />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
