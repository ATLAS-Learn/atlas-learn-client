import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

export default function TeacherStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => { loadStudents() }, [page, search])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const res = await api.getTeacherStudents({ search: search || undefined, limit, offset: (page - 1) * limit })
      const data = res?.data?.students || res?.students || res?.data || res || []
      setStudents(Array.isArray(data) ? data : [])
      setTotal(res?.data?.total || res?.total || data.length || 0)
    } catch { setStudents([]) } finally { setLoading(false) }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2524] mb-6">Students</h1>
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138] focus:ring-2 focus:ring-[#F2B138]/20"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-500">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Level</th>
                <th className="px-4 py-3 font-semibold text-gray-500">School</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No students found</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-[#282F2E]">{s.name || s.email?.split('@')[0]}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">{s.level ?? 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.school || '-'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/teacher/students/${s.id}`} className="text-[#F2B138] hover:underline font-medium text-xs">
                      View Progress
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
