import { useState, useEffect } from 'react'
import { api } from '../../api/client'

export default function TeacherDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [students, subjects] = await Promise.all([
        api.getTeacherStudents(),
        api.getSubjects(),
      ])
      const studentList = students?.data?.students || students?.students || students?.data || students || []
      const subjectList: any = subjects?.data || subjects || []
      setStats({
        totalStudents: Array.isArray(studentList) ? studentList.length : 0,
        totalSubjects: Array.isArray(subjectList) ? subjectList.length : 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2524] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: stats?.totalStudents ?? 0, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Subjects', value: stats?.totalSubjects ?? 0, color: 'bg-amber-50 text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-[#282F2E] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/teacher/students" className="p-4 bg-[#FAFAFA] rounded-xl border border-gray-100 hover:border-[#F2B138] transition-colors text-center">
            <svg className="w-6 h-6 text-[#F2B138] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="text-sm font-semibold text-[#282F2E]">View Students</p>
          </a>
          <a href="/teacher/content" className="p-4 bg-[#FAFAFA] rounded-xl border border-gray-100 hover:border-[#F2B138] transition-colors text-center">
            <svg className="w-6 h-6 text-[#F2B138] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p className="text-sm font-semibold text-[#282F2E]">Manage Content</p>
          </a>
          <a href="/teacher/quizzes" className="p-4 bg-[#FAFAFA] rounded-xl border border-gray-100 hover:border-[#F2B138] transition-colors text-center">
            <svg className="w-6 h-6 text-[#F2B138] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm font-semibold text-[#282F2E]">Manage Quizzes</p>
          </a>
        </div>
      </div>
    </div>
  )
}
