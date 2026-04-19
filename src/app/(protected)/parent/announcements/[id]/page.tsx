import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !announcement) {
    notFound()
  }

  return (
    <div className="p-4">
      <Link
        href="/parent/announcements"
        className="text-sm text-[#F59F0A] hover:underline mb-4 inline-block"
      >
        &larr; 連絡事項一覧に戻る
      </Link>

      <article className="bg-white rounded-lg border border-[#F0E6D3] p-5">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {announcement.title}
        </h1>
        <p className="text-xs text-gray-400 mb-4">
          {new Date(announcement.created_at).toLocaleDateString('ja-JP')}
        </p>
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {announcement.body}
        </div>
      </article>
    </div>
  )
}
