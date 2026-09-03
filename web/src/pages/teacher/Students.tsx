import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

export default function TeacherStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20

  const loadStudents = useCallback(async () => {
    try {
      const res = await api.getTeacherStudents({ search: search || undefined, limit, offset: page * limit })
      const data = res?.data || res?.students || res || []
      setStudents(Array.isArray(data) ? data : [])
      setTotal(res?.total || res?.data?.total || 0)
    } catch { setStudents([]) } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { loadStudents() }, [loadStudents])

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-[#084A59]'>Students</h2>
        <p className='text-sm text-gray-400 mt-0.5'>{total} student{total !== 1 ? 's' : ''}</p>
      </div>

      <div className='relative'>
        <svg className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
        </svg>
        <input
          type='text'
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder='Search by name or email...'
          className='w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
        />
      </div>

      <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-50/80 border-b border-gray-100'>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Student</th>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Level</th>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>School</th>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Quizzes</th>
                <th className='text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr><td colSpan={5} className='px-6 py-12 text-center text-gray-400'>Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className='px-6 py-12 text-center text-gray-400'>No students found</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className='hover:bg-gray-50/50 transition-colors'>
                  <td className='px-6 py-3.5'>
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0'>
                        {(s.name || s.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-[#084A59]'>{s.name || s.email?.split('@')[0]}</p>
                        <p className='text-xs text-gray-400'>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-3.5'>
                    <span className='inline-flex px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold ring-1 ring-slate-200'>
                      {s.level ?? 'N/A'}
                    </span>
                  </td>
                  <td className='px-6 py-3.5 text-sm text-gray-500'>{s.school || '—'}</td>
                  <td className='px-6 py-3.5 text-sm text-gray-500'>{s._count?.quizAttempts ?? '—'}</td>
                  <td className='px-6 py-3.5 text-right'>
                    <Link
                      to={`/teacher/students/${s.id}`}
                      style={{ textDecoration: 'none' }}
                      className='inline-flex items-center gap-1.5 text-xs font-semibold text-[#084A59] hover:text-[#011C26] px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors'
                    >
                      View Progress
                      <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > limit && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-gray-400'>
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className='px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              Previous
            </button>
            <span className='text-sm text-gray-500 font-medium px-2'>
              Page {page + 1} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className='px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
