'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'ホーム', href: '/parent' },
  { label: '入退場', href: '/parent/attendance' },
  { label: '連絡', href: '/parent/announcements' },
  { label: '写真', href: '/parent/photos' },
]

export function ParentNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0E6D3] flex">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
              isActive
                ? 'text-[#F59F0A] border-t-2 border-[#F59F0A]'
                : 'text-gray-500 hover:text-[#F59F0A]'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
