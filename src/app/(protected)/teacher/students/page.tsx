import { getStudents } from './actions'
import { StudentForm } from '@/components/student-form'
import { StudentList } from '@/components/student-list'
import { QrCardGenerator } from '@/components/qr-card-generator'

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">生徒管理</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">生徒を登録</h2>
        <StudentForm />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">登録済み生徒</h2>
        <StudentList students={students} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">QRカード出力</h2>
        <QrCardGenerator students={students} />
      </section>
    </div>
  )
}
