import { getPublicNotices } from './actions'
import { NoticeForm } from '@/components/notice-form'

export default async function NoticesPage() {
  const notices = await getPublicNotices()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">公開お知らせ管理</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">お知らせを登録</h2>
        <NoticeForm />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">登録済みお知らせ</h2>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-500">お知らせが登録されていません</p>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="border rounded-md p-4 bg-white shadow-sm"
              >
                <p className="font-medium text-gray-900">{notice.title}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {notice.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
