import { useEffect, useState } from 'react'
import { api } from '../../api/client'

function StatCard({ label, value, sub, icon, color = 'bg-white' }: { label: string; value: any; sub?: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div className={`${color} rounded-2xl p-5 flex flex-col gap-2`}>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-gray-500'>{label}</p>
        {icon && <div className='text-gray-400'>{icon}</div>}
      </div>
      <p className='text-3xl font-bold text-[#1F2524] tracking-tight'>{value}</p>
      {sub && <p className='text-xs font-medium text-gray-400'>{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data, maxVal, color = '#1F2524', hoverColor = '#F2B138', height = 100 }: { data: number[]; maxVal: number; color?: string; hoverColor?: string; height?: number }) {
  const max = Math.max(maxVal, 1)
  return (
    <div className='flex items-end gap-1' style={{ height }}>
      {data.map((val, i) => {
        const h = (val / max) * 100
        return (
          <div
            key={i}
            className='flex-1 rounded-t transition-colors cursor-default'
            style={{ height: `${Math.max(h, 2)}%`, backgroundColor: color }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = color)}
            title={`${val}`}
          />
        )
      })}
    </div>
  )
}

function StackedBarChart({ data, maxVal, colors, height = 100 }: { data: Array<{ students: number; teachers: number }>; maxVal: number; colors: { students: string; teachers: string }; height?: number }) {
  const max = Math.max(maxVal, 1)
  return (
    <div className='flex items-end gap-1' style={{ height }}>
      {data.map((val, i) => {
        const studentH = ((val.students || 0) / max) * 100
        const teacherH = ((val.teachers || 0) / max) * 100
        return (
          <div
            key={i}
            className='flex-1 flex flex-col justify-end rounded-t cursor-default'
            title={`Students: ${val.students || 0}, Teachers: ${val.teachers || 0}`}
          >
            <div
              style={{ height: `${Math.max(teacherH, 0)}%`, backgroundColor: colors.teachers }}
              className='rounded-t'
            />
            <div
              style={{ height: `${Math.max(studentH, 2)}%`, backgroundColor: colors.students }}
            />
          </div>
        )
      })}
    </div>
  )
}

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
        else console.error('Overview failed:', ov.reason)
        if (cc.status === 'fulfilled') setChapterCompletion(cc.value)
        else console.error('Chapter completion failed:', cc.reason)
        if (qs.status === 'fulfilled') setQuizStats(qs.value)
        else console.error('Quiz stats failed:', qs.reason)
        if (w.status === 'fulfilled') setWau(w.value)
        else console.error('WAU failed:', w.reason)
        if (st.status === 'fulfilled') setSignupTrend(st.value)
        else console.error('Signup trend failed:', st.reason)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading analytics...</p>
        </div>
      </div>
    )
  }

  const users = overview?.users || {}
  const active = overview?.activeUsers || {}
  const content = overview?.content || {}
  const quiz = overview?.quizzes || {}
  const ch1 = chapterCompletion?.primaryMetric || {}
  const summary = quizStats?.summary || {}
  const wauTrend = wau?.trend ?? []
  const signupData = signupTrend?.trend ?? []

  const wauMax = Math.max(...wauTrend.map((w: any) => w.activeUsers || 0), 1)
  const signupMax = Math.max(...signupData.map((d: any) => (d.students || 0) + (d.teachers || 0)), 1)

  return (
    <div className='space-y-6'>
      {/* Hero Stats */}
      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4'>
        <StatCard label='Total Users' value={users.total ?? '—'} sub={`${users.students ?? 0} students`} />
        <StatCard label='Active (Weekly)' value={active.weekly ?? '—'} sub={`${active.monthly ?? 0} monthly`} />
        <StatCard label='Subjects' value={content.subjects ?? '—'} sub={`${content.chapters ?? 0} chapters`} />
        <StatCard label='Quizzes' value={summary.totalQuizzes ?? '—'} sub={`${summary.totalAttempts ?? 0} attempts`} />
        <StatCard
          label='Pass Rate'
          value={`${summary.overallPassRate ?? 0}%`}
          sub={`${summary.totalPassed ?? 0} passed`}
          color={summary.overallPassRate >= 70 ? 'bg-slate-50' : summary.overallPassRate >= 50 ? 'bg-slate-50/60' : 'bg-slate-100'}
        />
        <StatCard
          label='Chapter 1 Completion'
          value={`${ch1.chapter1CompletionRate ?? 0}%`}
          sub={`${ch1.chapter1QuizPassRate ?? 0}% quiz pass`}
          color='bg-slate-50'
        />
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* WAU Trend */}
        {wau && (
          <div className='bg-white rounded-2xl p-6'>
            <div className='flex items-center justify-between mb-5'>
              <div>
                <h3 className='text-base font-bold text-[#1F2524]'>Weekly Active Users</h3>
                <p className='text-sm text-gray-400 mt-0.5'>Last 12 weeks</p>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold text-[#1F2524]'>{wau.currentWAU}</p>
                <p className={`text-sm font-semibold ${(wau.wauChangePercent ?? 0) >= 0 ? 'text-slate-500' : 'text-slate-400'}`}>
                  {(wau.wauChangePercent ?? 0) >= 0 ? '+' : ''}{wau.wauChangePercent ?? 0}%
                </p>
              </div>
            </div>
            <MiniBarChart
              data={wauTrend.slice(-12).map((w: any) => w.activeUsers || 0)}
              maxVal={wauMax}
              height={120}
            />
            <div className='flex justify-between mt-2'>
              {wauTrend.slice(-12).filter((_: any, i: number) => i % 3 === 0).map((w: any, i: number) => (
                <span key={i} className='text-[10px] text-gray-400'>
                  {w.weekStart?.slice(5) || ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Signup Trend */}
        {signupTrend && (
          <div className='bg-white rounded-2xl p-6'>
            <div className='flex items-center justify-between mb-5'>
              <div>
                <h3 className='text-base font-bold text-[#1F2524]'>New Signups</h3>
                <p className='text-sm text-gray-400 mt-0.5'>Last 30 days — {signupTrend.totalNewUsers ?? 0} total</p>
              </div>
              <div className='flex items-center gap-3 text-xs'>
                <span className='flex items-center gap-1.5'><span className='w-2 h-2 rounded-full bg-[#1F2524]' /> Teachers</span>
                <span className='flex items-center gap-1.5'><span className='w-2 h-2 rounded-full bg-slate-300' /> Students</span>
              </div>
            </div>
            <StackedBarChart
              data={signupData.slice(-30).map((d: any) => ({ students: d.students || 0, teachers: d.teachers || 0 }))}
              maxVal={signupMax}
              colors={{ students: '#CBD5E1', teachers: '#1F2524' }}
              height={120}
            />
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Chapter Completion */}
        {chapterCompletion?.primaryMetric && (
          <div className='bg-white rounded-2xl p-6'>
            <h3 className='text-base font-bold text-[#1F2524] mb-4'>Chapter 1 Funnel</h3>
            <p className='text-xs text-gray-400 mb-5'>Student progression through first chapter</p>
            <div className='space-y-4'>
              {[
                { label: 'Students Enrolled', value: ch1.totalStudents, pct: 100, color: 'bg-gray-200' },
                { label: 'Completion Rate', value: ch1.chapter1CompletionRate, pct: ch1.chapter1CompletionRate, color: 'bg-slate-500' },
                { label: 'Quiz Pass Rate', value: ch1.chapter1QuizPassRate, pct: ch1.chapter1QuizPassRate, color: 'bg-slate-400' },
              ].map((item, i) => (
                <div key={i}>
                  <div className='flex items-center justify-between mb-1.5'>
                    <span className='text-sm font-medium text-gray-600'>{item.label}</span>
                    <span className='text-sm font-bold text-[#1F2524]'>
                      {i === 0 ? item.value : `${item.value}%`}
                    </span>
                  </div>
                  <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Stats */}
        {quizStats?.summary && (
          <div className='bg-white rounded-2xl p-6'>
            <h3 className='text-base font-bold text-[#1F2524] mb-4'>Quiz Performance</h3>
            <p className='text-xs text-gray-400 mb-5'>Overall quiz metrics</p>
            <div className='grid grid-cols-2 gap-4'>
              {[
                { label: 'Total Attempts', value: summary.totalAttempts, color: 'text-[#1F2524]' },
                { label: 'Passed', value: summary.totalPassed, color: 'text-slate-600' },
                { label: 'Failed', value: summary.totalFailed, color: 'text-slate-400' },
                { label: 'Pass Rate', value: `${summary.overallPassRate ?? 0}%`, color: 'text-[#B8860B]' },
              ].map((s, i) => (
                <div key={i} className='bg-gray-50 rounded-xl p-3'>
                  <p className='text-xs text-gray-400 mb-1'>{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Breakdown */}
        <div className='bg-white rounded-2xl p-6'>
          <h3 className='text-base font-bold text-[#1F2524] mb-4'>User Breakdown</h3>
          <p className='text-xs text-gray-400 mb-5'>Platform user composition</p>
          <div className='space-y-3'>
            {[
              { label: 'Students', value: users.students ?? 0, total: users.total ?? 1, color: 'bg-slate-500' },
              { label: 'Teachers', value: users.teachers ?? 0, total: users.total ?? 1, color: 'bg-slate-400' },
              { label: 'Admins', value: users.admins ?? 0, total: users.total ?? 1, color: 'bg-[#F2B138]' },
              { label: 'Deactivated', value: users.deactivated ?? 0, total: users.total ?? 1, color: 'bg-slate-300' },
            ].map((item, i) => (
              <div key={i}>
                <div className='flex items-center justify-between mb-1.5'>
                  <span className='text-sm font-medium text-gray-600'>{item.label}</span>
                  <span className='text-sm font-bold text-[#1F2524]'>{item.value}</span>
                </div>
                <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Content Summary */}
          <div className='mt-6 pt-5 border-t border-gray-100'>
            <h4 className='text-sm font-bold text-[#1F2524] mb-3'>Content Summary</h4>
            <div className='grid grid-cols-3 gap-3'>
              {[
                { label: 'Subjects', value: content.subjects ?? 0 },
                { label: 'Chapters', value: content.chapters ?? 0 },
                { label: 'Lessons', value: content.lessons ?? 0 },
              ].map((s, i) => (
                <div key={i} className='text-center'>
                  <p className='text-xl font-bold text-[#1F2524]'>{s.value}</p>
                  <p className='text-[11px] text-gray-400 font-medium'>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
