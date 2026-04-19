import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: '#FFFDF7' }}>
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold" style={{ color: '#F59F0A' }}>
            がくどう
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#F59F0A' }}
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
            <p className="font-medium" style={{ color: '#F59F0A' }}>がくどう</p>
            <p>&copy; {new Date().getFullYear()} ひまわり学童クラブ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
