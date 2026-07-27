import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [chapterCompletion, setChapterCompletion] = useState<any>(null)
  const [quizStats, setQuizStats] = useState<any>(null)
  const [wau, setWau] = useState<any>(null)
  const [signupTrend, setSignupTrend] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, cc, qs, w, st] = await Promise.allSettled([
          api.getAnalyticsOverview(),
          api.getChapterCompletion(),
          api.getQuizAnalytics(),
          api.getWAU(),
          api.getSignupTrend(),
        ])
        if (ov.status === 'fulfilled') setOverview(ov.value)
        if (cc.status === 'fulfilled') setChapterCompletion(cc.value)
        if (qs.status === 'fulfilled') setQuizStats(qs.value)
        if (w.status === 'fulfilled') setWau(w.value)
        if (st.status === 'fulfilled') setSignupTrend(st.value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading analytics...</div></div>

  const stat = (label: string, value: string | number, color = '#282F2E') => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <h2 className="text-lg font-bold text-[#282F2E]">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stat('Total Users', overview?.users?.total ?? '-')}
        {stat('Students', overview?.users?.students ?? '-', '#4CAF50')}
        {stat('Teachers', overview?.users?.teachers ?? '-', '#2196F3')}
        {stat('Admins', overview?.users?.admins ?? '-', '#F2B138')}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stat('Weekly Active', overview?.activeUsers?.weekly ?? '-', '#9C27B0')}
        {stat('Monthly Active', overview?.activeUsers?.monthly ?? '-', '#9C27B0')}
        {stat('Deactivated', overview?.users?.deactivated ?? '-', '#F44336')}
        {stat('Total Quiz Attempts', overview?.quizzes?.totalAttempts ?? '-')}
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stat('Subjects', overview?.content?.subjects ?? '-', '#F2B138')}
        {stat('Chapters', overview?.content?.chapters ?? '-')}
        {stat('Lessons', overview?.content?.lessons ?? '-')}
      </div>

      {/* WAU Trend */}
      {wau && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#282F2E] mb-1">Weekly Active Users</h3>
          <p className="text-sm text-gray-500 mb-4">
            Current: <span className="font-bold text-[#F2B138]">{wau.currentWAU}</span>
            {' '}&middot; Change: {' '}
            <span className={`font-bold ${(wau.wauChangePercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {(wau.wauChangePercent ?? 0) >= 0 ? '+' : ''}{wau.wauChangePercent ?? 0}%
            </span>
          </p>
          <div className="flex items-end gap-1 h-32">
            {(wau.trend ?? []).slice(-12).map((w: any, i: number) => {
              const max = Math.max(...(wau.trend ?? []).map((t: any) => t.activeUsers || 0), 1)
              const h = ((w.activeUsers || 0) / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-[#F2B138] transition-all"
                    style={{ height: `${Math.max(h, 4)}%` }}
                    title={`${w.activeUsers} users`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Chapter Completion */}
      {chapterCompletion?.primaryMetric && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#282F2E] mb-1">Chapter 1 Completion (Key Metric)</h3>
          <p className="text-sm text-gray-500 mb-4">Leading indicator of student engagement</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stat('Total Students', chapterCompletion.primaryMetric.totalStudents ?? '-')}
            {stat('Completion Rate', `${chapterCompletion.primaryMetric.chapter1CompletionRate ?? 0}%`, '#4CAF50')}
            {stat('Quiz Pass Rate', `${chapterCompletion.primaryMetric.chapter1QuizPassRate ?? 0}%`, '#2196F3')}
          </div>
        </div>
      )}

      {/* Quiz Stats */}
      {quizStats?.summary && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#282F2E] mb-1">Quiz Statistics</h3>
          <p className="text-sm text-gray-500 mb-4">Overall pass/fail rates across all quizzes</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stat('Total Quizzes', quizStats.summary.totalQuizzes ?? '-')}
            {stat('Total Attempts', quizStats.summary.totalAttempts ?? '-')}
            {stat('Passed', quizStats.summary.totalPassed ?? '-', '#4CAF50')}
            {stat('Failed', quizStats.summary.totalFailed ?? '-', '#F44336')}
            {stat('Pass Rate', `${quizStats.summary.overallPassRate ?? 0}%`, '#F2B138')}
          </div>
        </div>
      )}

      {/* Signup Trend */}
      {signupTrend && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#282F2E] mb-1">Signups (Last 30 Days)</h3>
          <p className="text-sm text-gray-500 mb-4">Total new users: <span className="font-bold text-[#F2B138]">{signupTrend.totalNewUsers ?? 0}</span></p>
          <div className="flex items-end gap-0.5 h-24">
            {(signupTrend.trend ?? []).slice(-30).map((d: any, i: number) => {
              const max = Math.max(...(signupTrend.trend ?? []).map((t: any) => t.total || 0), 1)
              const h = ((d.total || 0) / max) * 100
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-[#F2B138]"
                  style={{ height: `${Math.max(h, 2)}%` }}
                  title={`${d.date}: ${d.total} (${d.students} students, ${d.teachers} teachers)`}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
