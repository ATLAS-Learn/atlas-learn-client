import { useEffect, useState } from 'react'
import { api } from '../../api/client'

function StatCard({ label, value, sub, icon, color = 'bg-white' }: { label: string; value: any; sub?: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div className={`${color} rounded-3xl p-7 flex flex-col gap-2 hover:shadow-lg transition-all duration-200`}>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-gray-500'>{label}</p>
        {icon && <div className='text-gray-400'>{icon}</div>}
      </div>
      <p className='text-3xl font-bold text-[#084A59] tracking-tight'>{value}</p>
      {sub && <p className='text-xs font-medium text-gray-400'>{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data, maxVal, color = '#084A59', hoverColor = '#F2B138', height = 100 }: { data: number[]; maxVal: number; color?: string; hoverColor?: string; height?: number }) {
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

function StackedBarChart({ data, maxVal, colors, height = 100 }: { data: Array<{ students: number; teachers: number; admins: number; total: number }>; maxVal: number; colors: { students: string; teachers: string; admins: string }; height?: number }) {
  const max = Math.max(Number(maxVal) || 0, 1)
  const chartWidth = 900
  const chartHeight = height
  const chartBottom = chartHeight - 18
  const chartTop = 8
  const chartPlotHeight = chartBottom - chartTop
  const barWidth = Math.max(8, Math.min(24, (chartWidth - 24) / Math.max(data.length, 1) - 4))

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className='w-full h-full' role='img' aria-label='New signups chart'>
      <line x1='0' x2={chartWidth} y1={chartBottom} y2={chartBottom} stroke='#E5E7EB' />
      {data.map((val, i) => {
        const total = Number(val.total) || 0
        const students = Number(val.students) || 0
        const teachers = Number(val.teachers) || 0
        const admins = Math.max(Number(val.admins) || total - students - teachers, 0)
        const x = 12 + (i / Math.max(data.length - 1, 1)) * (chartWidth - 24)
        const scale = chartPlotHeight / max
        const studentHeight = students * scale
        const teacherHeight = teachers * scale
        const adminHeight = admins * scale
        const studentY = chartBottom - studentHeight
        const teacherY = studentY - teacherHeight
        const adminY = teacherY - adminHeight
        return (
          <g key={i}>
            <title>{`${val.date || ''}: ${total} signup${total === 1 ? '' : 's'}`}</title>
            {students > 0 && <rect x={x - barWidth / 2} y={studentY} width={barWidth} height={studentHeight} fill={colors.students} />}
            {teachers > 0 && <rect x={x - barWidth / 2} y={teacherY} width={barWidth} height={teacherHeight} fill={colors.teachers} />}
            {admins > 0 && <rect x={x - barWidth / 2} y={adminY} width={barWidth} height={adminHeight} fill={colors.admins} />}
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [chapterCompletion, setChapterCompletion] = useState<any>(null)
  const [quizStats, setQuizStats] = useState<any>(null)
  const [wau, setWau] = useState<any>(null)
  const [signupTrend, setSignupTrend] = useState<any>(null)
  const [subjectReports, setSubjectReports] = useState<any[]>([])
  const [studentStats, setStudentStats] = useState<{ total: number; active: number; inactive: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, cc, qs, w, st, sr, ss] = await Promise.allSettled([
          api.getAnalyticsOverview(),
          api.getChapterCompletion(),
          api.getQuizAnalytics(),
          api.getWAU(),
          api.getSignupTrend(),
          api.getSubjectReports(),
          api.getAdminStudentStats(),
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
        if (sr.status === 'fulfilled') {
          const value: any = sr.value
          setSubjectReports(Array.isArray(value) ? value : value?.subjects || value?.data || [])
        } else console.error('Subject reports failed:', sr.reason)
        if (ss.status === 'fulfilled') setStudentStats(ss.value)
        else console.error('Student stats failed:', ss.reason)
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
  const totalStudents = studentStats?.total ?? users.students ?? 0
  const activeStudents = studentStats?.active ?? 0
  const inactiveStudents = studentStats?.inactive ?? 0

  const ch1 = chapterCompletion?.primaryMetric || {}
  const summary = quizStats?.summary || {}
  const wauTrend = wau?.trend ?? []
  const signupData = signupTrend?.trend ?? []

  const wauMax = Math.max(...wauTrend.map((w: any) => w.activeUsers || 0), 1)
  const normalizedSignupData = signupData.map((d: any) => {
    const students = Number(d.students) || 0
    const teachers = Number(d.teachers) || 0
    const admins = Number(d.admins) || 0
    const total = Number(d.total ?? d.count) || students + teachers + admins
    return { ...d, students, teachers, admins, total }
  })
  const signupMax = Math.max(...normalizedSignupData.map((d: any) => d.total), 1)

  return (
    <div className='space-y-8'>
      {/* Hero Stats */}
      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6'>
        <StatCard label='Total Users' value={users.total ?? '—'} sub={`${totalStudents} students`} />
        <StatCard label='Students' value={totalStudents} sub={`${activeStudents} active`} />
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
      {subjectReports.length > 0 && (
        <section>
          <div className='flex items-end justify-between mb-4'>
            <div>
              <h3 className='text-lg font-bold text-[#084A59]'>Reports by Subject</h3>
              <p className='text-sm text-gray-400 mt-0.5'>Quiz and exam performance for this school</p>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'>
            {subjectReports.map((subject: any) => {
              const average = subject.averageScore ?? subject.average ?? 0
              const passRate = subject.passRate ?? subject.overallPassRate ?? 0
              const pending = subject.pendingEssayReviews ?? subject.pendingReviews ?? 0
              const quizzes = subject.quizCount ?? subject.quizzes?.length ?? 0
              const exams = subject.examCount ?? subject.exams?.length ?? 0
              return (
                <details key={subject.subjectId || subject.id || subject.subjectName} className='group bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                  <summary className='list-none cursor-pointer p-5 hover:bg-slate-50/60'>
                    <div className='flex items-start justify-between gap-3'>
                      <h4 className='font-bold text-[#084A59]'>{subject.subjectName || subject.name || 'Subject'}</h4>
                      <span className='text-xs font-bold text-gray-400 group-open:rotate-180 transition-transform'>⌄</span>
                    </div>
                    <div className='grid grid-cols-3 gap-3 mt-4'>
                      <div><p className='text-xl font-bold text-[#084A59]'>{Number(average).toFixed(1)}%</p><p className='text-[11px] text-gray-400'>Average</p></div>
                      <div><p className='text-xl font-bold text-[#084A59]'>{Number(passRate).toFixed(1)}%</p><p className='text-[11px] text-gray-400'>Pass rate</p></div>
                      <div><p className={`text-xl font-bold ${pending > 0 ? 'text-amber-600' : 'text-green-600'}`}>{pending}</p><p className='text-[11px] text-gray-400'>Essay review</p></div>
                    </div>
                  </summary>
                  <div className='border-t border-gray-100 px-5 py-4 text-xs text-gray-500 space-y-2'>
                    <div className='flex justify-between'><span>Quizzes</span><strong className='text-[#084A59]'>{quizzes}</strong></div>
                    <div className='flex justify-between'><span>Exams</span><strong className='text-[#084A59]'>{exams}</strong></div>
                    {[...(subject.quizzes || []), ...(subject.exams || [])].map((item: any) => (
                      <div key={item.id} className='flex justify-between gap-3 pt-2 border-t border-gray-50'>
                        <span className='truncate'>{item.title || item.name}</span>
                        <span className='shrink-0'>{item.averageScore == null ? '—' : `${item.averageScore}%`}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      )}

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* WAU Trend */}
        {wau && (
          <div className='bg-white rounded-3xl p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-5'>
              <div>
                <h3 className='text-lg font-bold text-[#084A59]'>Weekly Active Users</h3>
                <p className='text-sm text-gray-400 mt-0.5'>Last 12 weeks</p>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold text-[#084A59]'>{wau.currentWAU}</p>
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
                <span key={i} className='text-xs text-gray-400'>
                  {w.weekStart?.slice(5) || ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Signup Trend */}
        {signupTrend && (
          <div className='bg-white rounded-3xl p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-5'>
              <div>
                <h3 className='text-lg font-bold text-[#084A59]'>New Signups</h3>
                <p className='text-sm text-gray-400 mt-0.5'>Last 30 days — {signupTrend.totalNewUsers ?? 0} total</p>
              </div>
              <div className='flex items-center gap-3 text-xs'>
                <span className='flex items-center gap-1.5'><span className='w-2 h-2 rounded-full bg-[#084A59]' /> Teachers</span>
                <span className='flex items-center gap-1.5'><span className='w-2 h-2 rounded-full bg-slate-300' /> Students</span>
                <span className='flex items-center gap-1.5'><span className='w-2 h-2 rounded-full bg-[#F2B138]' /> Admins</span>
              </div>
            </div>
            <StackedBarChart
              data={normalizedSignupData.slice(-30)}
              maxVal={signupMax}
              colors={{ students: '#CBD5E1', teachers: '#084A59', admins: '#F2B138' }}
              height={120}
            />
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Chapter Completion */}
        {chapterCompletion?.primaryMetric && (
          <div className='bg-white rounded-3xl p-6 hover:shadow-lg transition-all duration-200'>
            <h3 className='text-lg font-bold text-[#084A59] mb-4'>Chapter 1 Funnel</h3>
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
                    <span className='text-sm font-bold text-[#084A59]'>
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
          <div className='bg-white rounded-3xl p-6 hover:shadow-lg transition-all duration-200'>
            <h3 className='text-lg font-bold text-[#084A59] mb-4'>Quiz Performance</h3>
            <p className='text-xs text-gray-400 mb-5'>Overall quiz metrics</p>
            <div className='grid grid-cols-2 gap-4'>
              {[
                { label: 'Total Attempts', value: summary.totalAttempts, color: 'text-[#084A59]' },
                { label: 'Passed', value: summary.totalPassed, color: 'text-slate-600' },
                { label: 'Failed', value: summary.totalFailed, color: 'text-slate-400' },
                { label: 'Pass Rate', value: `${summary.overallPassRate ?? 0}%`, color: 'text-[#084A59]' },
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
        <div className='bg-white rounded-3xl p-6 hover:shadow-lg transition-all duration-200'>
          <h3 className='text-lg font-bold text-[#084A59] mb-4'>User Breakdown</h3>
          <p className='text-xs text-gray-400 mb-5'>Platform user composition</p>
          <div className='space-y-3'>
            {[
              { label: 'Students', value: totalStudents, total: users.total ?? 1, color: 'bg-slate-500' },
              { label: 'Teachers', value: users.teachers ?? 0, total: users.total ?? 1, color: 'bg-slate-400' },
              { label: 'Admins', value: users.admins ?? 0, total: users.total ?? 1, color: 'bg-[#F2B138]' },
              { label: 'Inactive students', value: inactiveStudents, total: Math.max(totalStudents, 1), color: 'bg-slate-300' },
            ].map((item, i) => (
              <div key={i}>
                <div className='flex items-center justify-between mb-1.5'>
                  <span className='text-sm font-medium text-gray-600'>{item.label}</span>
                  <span className='text-sm font-bold text-[#084A59]'>{item.value}</span>
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
            <h4 className='text-sm font-bold text-[#084A59] mb-3'>Content Summary</h4>
            <div className='grid grid-cols-3 gap-3'>
              {[
                { label: 'Subjects', value: content.subjects ?? 0 },
                { label: 'Chapters', value: content.chapters ?? 0 },
                { label: 'Lessons', value: content.lessons ?? 0 },
              ].map((s, i) => (
                <div key={i} className='text-center'>
                  <p className='text-xl font-bold text-[#084A59]'>{s.value}</p>
                  <p className='text-xs text-gray-400 font-medium'>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
