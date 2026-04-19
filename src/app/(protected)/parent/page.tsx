export default function ParentDashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ホーム</h1>

      <div className="space-y-4">
        <section className="bg-white rounded-lg border border-[#F0E6D3] p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">今日の入退場</h2>
          <p className="text-gray-500 text-sm">まだ記録がありません</p>
        </section>

        <section className="bg-white rounded-lg border border-[#F0E6D3] p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">最新の連絡</h2>
          <p className="text-gray-500 text-sm">新しい連絡はありません</p>
        </section>
      </div>
    </div>
  )
}
