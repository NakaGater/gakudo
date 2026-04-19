import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ParentAnnouncementsPage() {
  const supabase = await createClient()
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">連絡事項</h1>

      {announcements && announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a: { id: string; title: string; created_at: string }) => (
            <Link
              key={a.id}
              href={`/parent/announcements/${a.id}`}
              className="block bg-white rounded-lg border border-[#F0E6D3] p-4 hover:border-[#F59F0A] transition-colors"
            >
              <p className="font-semibold text-gray-900">{a.title}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(a.created_at).toLocaleDateString('ja-JP')}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">連絡事項はまだありません</p>
      )}
    </div>
  )
}
