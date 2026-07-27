import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../api/client'

export default function StudentDetail() {
  const { studentId } = useParams()
  const [progress, setProgress] = useState<any>(null)
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'progress' | 'quizzes'>('progress')

  useEffect(() => { loadData() }, [studentId])

  const loadData = async () => {
    if (!studentId) return
    try {
      const [prog, quizzes] = await Promise.all([
        api.getTeacherStudentProgress(studentId),
        api.getTeacherStudentQuizAttempts(studentId),
      ])
      setProgress(prog?.data || prog)
      const attemptData = quizzes?.data?.attempts || quizzes?.data || quizzes?.attempts || quizzes || []
      setQuizAttempts(Array.isArray(attemptData) ? attemptData : [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading student data...</div>
  if (!progress) return <div className="flex items-center justify-center h-64 text-gray-400">Student not found</div>

  const overall = progress?.overall || progress
  const subjects = progress?.subjects || []

  return (
    <div>
      <div className="mb-6">
        <Link to="/teacher/students" className="text-sm text-[#F2B138] mb-2 inline-block">&larr; Back to Students</Link>
        <h1 className="text-2xl font-bold text-[#1F2524]">Student Progress</h1>
        <p className="text-sm text-gray-500 mt-1">ID: {studentId}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Overall Progress</p>
          <p className="text-xl font-bold text-[#282F2E]">{overall?.completionPercentage ?? overall?.overall?.completionPercentage ?? 0}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Level</p>
          <p className="text-xl font-bold text-blue-600">{overall?.level ?? overall?.overall?.level ?? 'N/A'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Assessment Score</p>
          <p className="text-xl font-bold text-green-600">{overall?.assessmentScore ?? overall?.overall?.assessmentScore ?? 'N/A'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Quiz Attempts</p>
          <p className="text-xl font-bold text-amber-600">{quizAttempts.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['progress', 'quizzes'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-[#F2B138] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'progress' ? 'Subject Progress' : 'Quiz History'}
          </button>
        ))}
      </div>

      {tab === 'progress' && (
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <p className="text-gray-400 text-sm">No subject data available</p>
          ) : subjects.map((sub: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#282F2E]">{sub.name || sub.subjectName}</h3>
                <span className="text-sm font-semibold text-[#F2B138]">{sub.completionPercentage ?? 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div className="bg-[#F2B138] h-2 rounded-full transition-all" style={{ width: `${sub.completionPercentage ?? 0}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Chapters</p>
                  <p className="font-semibold text-[#282F2E]">{sub.chaptersCompleted ?? 0}/{sub.totalChapters ?? sub.chapters?.length ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lessons</p>
                  <p className="font-semibold text-[#282F2E]">{sub.lessonsCompleted ?? 0}/{sub.totalLessons ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quizzes</p>
                  <p className="font-semibold text-[#282F2E]">{sub.quizzesPassed ?? 0}/{sub.totalQuizzes ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'quizzes' && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Quiz</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Subject</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Score</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No quiz attempts</td></tr>
                ) : quizAttempts.map((a: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-[#282F2E]">{a.quiz?.title || a.quizTitle || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.subject?.name || a.subjectName || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-[#282F2E]">{a.score}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${a.passed || a.isPassed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {a.passed || a.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt || a.completedAt).toLocaleDateString()}</td>
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
