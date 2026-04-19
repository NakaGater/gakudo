import { getParents, getStudents } from './actions'
import { ParentForm } from '@/components/parent-form'

export default async function ParentsPage() {
  const [parents, students] = await Promise.all([getParents(), getStudents()])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">保護者管理</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">保護者を登録</h2>
        <ParentForm students={students} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">登録済み保護者</h2>
        {parents.length === 0 ? (
          <p className="text-sm text-gray-500">保護者が登録されていません</p>
        ) : (
          <div className="space-y-3">
            {parents.map((parent) => (
              <div
                key={parent.id}
                className="border rounded-md p-4 bg-white shadow-sm"
              >
                <p className="font-medium text-gray-900">{parent.name}</p>
                <p className="text-sm text-gray-500">{parent.email}</p>
                {parent.students.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {parent.students.map((student) => (
                      <span
                        key={student!.id}
                        className="inline-block px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-xs rounded-full"
                      >
                        {student!.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
