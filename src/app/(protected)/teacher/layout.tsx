import { TeacherNav } from '@/components/teacher-nav'

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#FFFDF7]">
      <TeacherNav />
      <main className="flex-1 md:ml-0">{children}</main>
    </div>
  )
}
