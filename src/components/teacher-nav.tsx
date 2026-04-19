'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const navItems = [
  { label: '生徒管理', href: '/teacher/students' },
  { label: '入退場記録', href: '/teacher/attendance' },
  { label: '入退場スキャン', href: '/teacher/attendance/scan' },
  { label: '連絡事項', href: '/teacher/announcements' },
  { label: '写真', href: '/teacher/photos' },
  { label: '公開お知らせ', href: '/teacher/notices' },
]

export function TeacherNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-[#FFFDF7] border-r border-[#F0E6D3]">
      <div className="p-4 border-b border-[#F0E6D3]">
        <span className="text-xl font-bold text-[#F59F0A]">がくどう</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#F0E6D3] hover:text-[#F59F0A] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[#F0E6D3]">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#FFFDF7] border border-[#F0E6D3] shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        <svg className="w-6 h-6 text-[#F59F0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        {sidebar}
      </aside>
    </>
  )
}
