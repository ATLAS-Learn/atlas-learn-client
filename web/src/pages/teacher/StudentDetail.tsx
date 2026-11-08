import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../api/client'
import StudentAvatar from '../../components/StudentAvatar'

export default function StudentDetail() {
  const { studentId } = useParams()
  const [progress, setProgress] = useState<any>(null)
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [examAttempts, setExamAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'progress' | 'quizzes'>('progress')

  const loadData = async () => {
    if (!studentId) return
    try {
      const [prog, quizzes, examsResponse] = await Promise.all([
        api.getTeacherStudentProgress(studentId),
        api.getTeacherStudentQuizAttempts(studentId),
        api.getExams({ limit: 200 }),
      ])
      setProgress(prog?.data || prog)
      const attemptData = quizzes?.data?.attempts || quizzes?.data || quizzes?.attempts || quizzes || []
      setQuizAttempts(Array.isArray(attemptData) ? attemptData : [])
      const exams = examsResponse?.data?.exams || examsResponse?.data || examsResponse?.exams || examsResponse || []
      const examList = Array.isArray(exams) ? exams : []
      const attempts = await Promise.all(examList.map(async (exam: any) => {
        try {
          const response = await api.getExamAttempts(exam.id, { limit: 1000 })
          const list = response?.data?.attempts || response?.data || response?.attempts || response || []
          const matching = (Array.isArray(list) ? list : []).filter((attempt: any) => {
            const attemptStudentId = attempt.studentId || attempt.userId || attempt.student?.id || attempt.user?.id
            return attemptStudentId === studentId
          })
          return matching.map((attempt: any) => ({ ...attempt, exam }))
        } catch {
          return []
        }
      }))
      setExamAttempts(attempts.flat())
    } catch {} finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData() }, [studentId, loadData])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading student data...</p>
        </div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <p className='text-gray-400'>Student not found</p>
      </div>
    )
  }

  const overall = progress?.overall || progress
  const subjects = progress?.subjects || []
  const topLevel = progress || {}
  const assessment = topLevel.assessment || topLevel.assessmentResult || topLevel.latestAssessment || {}
  const assessmentScore = topLevel.assessmentScore
    ?? assessment.score
    ?? assessment.percentage
    ?? assessment.correctAnswers
  const scoreText = assessmentScore === undefined || assessmentScore === null
    ? 'N/A'
    : `${assessmentScore}${assessmentScore <= 100 ? '%' : ''}`

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <Link to='/teacher/students' style={{ textDecoration: 'none' }} className='inline-flex items-center gap-1.5 text-sm text-[#084A59] hover:text-[#011C26] font-medium mb-2 transition-colors'>
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
          </svg>
          Back to Students
        </Link>
        <h2 className='text-2xl font-bold text-[#084A59]'>Student Progress</h2>
        <div className='flex items-center gap-3 mt-2'>
          <StudentAvatar student={progress?.student} size='md' />
          <p className='text-sm text-gray-400'>{progress?.student?.name || progress?.student?.email || studentId}</p>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        {[
          { label: 'Overall Progress', value: `${overall?.completionPercentage ?? 0}%`, color: 'bg-slate-100' },
          { label: 'Level', value: topLevel?.level ?? 'N/A', color: 'bg-slate-100' },
          { label: 'Assessment Score', value: scoreText, color: 'bg-slate-100' },
          { label: 'Quiz Attempts', value: quizAttempts.length, color: 'bg-slate-100' },
        ].map((s, i) => (
          <div key={i} className='bg-white rounded-2xl border border-gray-200 p-5'>
            <p className='text-sm font-medium text-gray-500'>{s.label}</p>
            <p className='text-2xl font-bold text-[#084A59] mt-1'>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className='flex gap-2'>
        {(['progress', 'quizzes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-[#084A59] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'progress' ? 'Subject Progress' : 'Quiz History'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'progress' && (
        <div className='space-y-4'>
          {subjects.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 p-10 text-center'>
              <p className='text-gray-400'>No subject data available</p>
            </div>
          ) : (
            subjects.map((sub: any, i: number) => (
              <div key={i} className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                <div className='px-5 py-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='font-bold text-[#084A59]'>{sub.name || sub.subjectName}</h3>
                    <span className='text-sm font-bold text-[#084A59]'>{sub.completionPercentage ?? 0}%</span>
                  </div>
                  <div className='h-2 bg-gray-100 rounded-full overflow-hidden mb-4'>
                    <div
                      className='h-full rounded-full bg-[#F2B138] transition-all'
                      style={{ width: `${sub.completionPercentage ?? 0}%` }}
                    />
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    {[
                      { label: 'Chapters', done: sub.chapters?.completed ?? 0, total: sub.chapters?.total ?? 0 },
                      { label: 'Lessons', done: sub.lessons?.completed ?? 0, total: sub.lessons?.total ?? 0 },
                      { label: 'Quizzes', done: sub.quizzes?.passed ?? 0, total: sub.quizzes?.total ?? 0 },
                    ].map((item, j) => (
                      <div key={j}>
                        <p className='text-xs text-gray-400 mb-0.5'>{item.label}</p>
                        <p className='text-sm font-bold text-[#084A59]'>{item.done}/{item.total}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
          <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
            <div className='px-5 py-4 border-b border-gray-100'>
              <h3 className='font-bold text-[#084A59]'>Exam Results</h3>
            </div>
            {examAttempts.length === 0 ? (
              <p className='p-8 text-center text-gray-400'>No exam attempts</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead><tr className='bg-gray-50/80'>
                    <th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Exam</th>
                    <th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Subject</th>
                    <th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Score</th>
                    <th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Date</th>
                  </tr></thead>
                  <tbody className='divide-y divide-gray-50'>
                    {examAttempts.map((attempt: any, index: number) => {
                      const score = attempt.percentage ?? attempt.score
                      return <tr key={attempt.id || index}>
                        <td className='px-5 py-3 text-sm font-semibold text-[#084A59]'>{attempt.exam?.title || attempt.examTitle || '—'}</td>
                        <td className='px-5 py-3 text-sm text-gray-500'>{attempt.exam?.subject?.name || attempt.subject?.name || attempt.subjectName || '—'}</td>
                        <td className='px-5 py-3 text-sm font-bold text-[#084A59]'>{score === undefined || score === null ? '—' : `${score}%`}</td>
                        <td className='px-5 py-3 text-sm text-gray-500'>{attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'quizzes' && (
        <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='bg-gray-50/80 border-b border-gray-100'>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Quiz</th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Subject</th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Score</th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Date</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {quizAttempts.length === 0 ? (
                  <tr><td colSpan={5} className='px-6 py-12 text-center text-gray-400'>No quiz attempts</td></tr>
                ) : quizAttempts.map((a: any, i: number) => (
                  <tr key={i} className='hover:bg-gray-50/50 transition-colors'>
                    <td className='px-6 py-3.5 text-sm font-semibold text-[#084A59]'>{a.quiz?.title || a.quizTitle || '—'}</td>
                    <td className='px-6 py-3.5 text-sm text-gray-500'>{a.subject?.name || a.subjectName || '—'}</td>
                    <td className='px-6 py-3.5 text-sm font-bold text-[#084A59]'>{a.score}%</td>
                    <td className='px-6 py-3.5'>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        a.passed || a.isPassed ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {a.passed || a.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className='px-6 py-3.5 text-sm text-gray-500'>
                      {new Date(a.createdAt || a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
