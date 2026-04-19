import { ParentNav } from '@/components/parent-nav'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FFFDF7] pb-16">
      <main>{children}</main>
      <ParentNav />
    </div>
  )
}
