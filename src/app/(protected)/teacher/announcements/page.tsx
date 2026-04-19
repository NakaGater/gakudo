import { getAnnouncements } from './actions'
import { AnnouncementForm } from '@/components/announcement-form'

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">連絡事項管理</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">連絡事項を登録</h2>
        <AnnouncementForm />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">登録済み連絡事項</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500">連絡事項が登録されていません</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="border rounded-md p-4 bg-white shadow-sm"
              >
                <p className="font-medium text-gray-900">{announcement.title}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {announcement.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
