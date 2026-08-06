import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

export default function TeacherDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [students, subjects] = await Promise.allSettled([
          api.getTeacherStudents({ limit: 1 }),
          api.getSubjects({ includeChapters: true, includeChapterDetails: true }),
        ])
        if (students.status === 'rejected') console.error('Failed to load students:', students.reason)
        if (subjects.status === 'rejected') console.error('Failed to load subjects:', subjects.reason)
        const studentTotal = students.status === 'fulfilled' ? (students.value?.total ?? students.value?.data?.total ?? 0) : 0
        const subjectList = subjects.status === 'fulfilled' ? (Array.isArray(subjects.value) ? subjects.value : subjects.value?.data || []) : []
        let totalChapters = 0
        let totalLessons = 0
        for (const s of subjectList) {
          totalChapters += s.chapters?.length ?? s._count?.chapters ?? 0
          for (const ch of (s.chapters ?? [])) {
            totalLessons += ch.lessons?.length ?? ch._count?.lessons ?? 0
          }
        }
        setStats({
          totalStudents: studentTotal,
          totalSubjects: subjectList.length,
          totalChapters,
          totalLessons,
        })
      } catch (e) { console.error('Teacher dashboard load error:', e) } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[
          { label: 'Students', value: stats?.totalStudents ?? 0, color: 'bg-slate-50' },
          { label: 'Subjects', value: stats?.totalSubjects ?? 0, color: 'bg-slate-50' },
          { label: 'Chapters', value: stats?.totalChapters ?? 0, color: 'bg-slate-50' },
          { label: 'Lessons', value: stats?.totalLessons ?? 0, color: 'bg-slate-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-5`}>
            <p className='text-sm font-medium text-gray-500'>{s.label}</p>
            <p className='text-3xl font-bold text-[#1F2524] tracking-tight mt-1'>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className='text-base font-bold text-[#1F2524] mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {[
            { to: '/teacher/students', label: 'Students', desc: 'View student progress and quiz results', icon: <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}><path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' /></svg> },
            { to: '/teacher/content', label: 'Content', desc: 'Browse subjects, chapters, and lessons', icon: <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}><path strokeLinecap='round' strokeLinejoin='round' d='M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' /></svg> },
            { to: '/teacher/quizzes', label: 'Quizzes', desc: 'View quiz questions and manage quizzes', icon: <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}><path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg> },
          ].map((item, i) => (
            <Link key={i} to={item.to} style={{ textDecoration: 'none' }} className='bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group'>
              <div className='text-gray-300 group-hover:text-[#B8860B] transition-colors mb-4'>
                {item.icon}
              </div>
              <p className='text-base font-bold text-[#1F2524] mb-1'>{item.label}</p>
              <p className='text-sm text-gray-400'>{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
