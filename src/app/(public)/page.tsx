import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export default async function PublicHomePage() {
  const supabase = await createClient()
  const { data: notices } = await supabase
    .from('public_notices')
    .select('*')
    .order('published_at', { ascending: false })

  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section
        className="py-16 sm:py-24 text-center"
        style={{ backgroundColor: '#FFFDF7' }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ひまわり学童クラブ
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            子どもたちが安心して過ごせる、あたたかい放課後の居場所。
            <br className="hidden sm:block" />
            学びと遊びを通じて、一人ひとりの成長を見守ります。
          </p>
          <div className="mt-8">
            <a
              href="#info"
              className="inline-block rounded-lg px-6 py-3 text-white font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#F59F0A' }}
            >
              施設について詳しく見る
            </a>
          </div>
        </div>
      </section>

      {/* 施設概要 Section */}
      <section id="info" className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            施設概要
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-amber-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">所在地</h3>
              <p className="text-gray-600 text-sm">
                〒000-0000
                <br />
                東京都○○区△△ 1-2-3
                <br />
                ひまわり学童クラブ
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">開所時間</h3>
              <p className="text-gray-600 text-sm">
                平日: 放課後〜19:00
                <br />
                土曜日: 8:00〜18:00
                <br />
                日曜・祝日: 休所
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">連絡先</h3>
              <p className="text-gray-600 text-sm">
                TEL: 03-0000-0000
                <br />
                Email: info@himawari-gakudo.example.com
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">対象</h3>
              <p className="text-gray-600 text-sm">
                小学1年生〜6年生
                <br />
                定員: 40名
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 説明会案内 Section */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: '#FFFDF7' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            説明会のご案内
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-white border border-amber-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    第1回 入会説明会
                  </p>
                  <p className="text-sm text-gray-600">
                    2026年5月15日（金）18:00〜19:30
                  </p>
                </div>
                <span
                  className="inline-block self-start rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: '#F59F0A' }}
                >
                  受付中
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-white border border-amber-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    第2回 入会説明会
                  </p>
                  <p className="text-sm text-gray-600">
                    2026年6月20日（土）10:00〜11:30
                  </p>
                </div>
                <span className="inline-block self-start rounded-full bg-gray-400 px-3 py-1 text-xs font-medium text-white">
                  準備中
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* お知らせ Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            お知らせ
          </h2>
          {notices && notices.length > 0 ? (
            <div className="space-y-3">
              {notices.map((notice: { id: string; title: string; body: string; published_at: string }) => (
                <div key={notice.id} className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    {new Date(notice.published_at).toLocaleDateString('ja-JP')}
                  </p>
                  <p className="font-semibold text-gray-900 mb-1">{notice.title}</p>
                  <p className="text-gray-700 text-sm">{notice.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">
              現在お知らせはありません
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
