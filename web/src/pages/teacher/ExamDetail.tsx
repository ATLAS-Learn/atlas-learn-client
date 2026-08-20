import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function ExamDetail() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'questions' | 'attempts'>('questions')
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    points: 1,
    explanation: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (examId) loadExam() }, [examId])

  const loadExam = async () => {
    if (!examId) return
    try {
      const data = await api.getExam(examId)
      setExam(data)
    } catch {} finally { setLoading(false) }
  }

  const loadAttempts = async () => {
    if (!examId) return
    try {
      const res = await api.getExamAttempts(examId)
      setAttempts(res?.data || [])
      setStats(res?.stats || null)
    } catch {}
  }

  useEffect(() => {
    if (tab === 'attempts' && examId) loadAttempts()
  }, [tab, examId])

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examId) return
    setSaving(true)
    try {
      const existingQuestions = exam.questions || []
      await api.updateExam(examId, {
        questions: [
          ...existingQuestions.map((q: any) => ({
            questionText: q.questionText,
            explanation: q.explanation,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            points: q.points,
          })),
          {
            questionText: questionForm.questionText,
            explanation: questionForm.explanation || undefined,
            options: questionForm.options.filter(o => o.trim()),
            correctAnswerIndex: questionForm.correctAnswerIndex,
            points: questionForm.points,
          },
        ],
      })
      setShowAddQuestion(false)
      setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, points: 1, explanation: '' })
      loadExam()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleDeleteQuestion = async (questionIndex: number) => {
    if (!examId || !confirm('Delete this question?')) return
    try {
      const existingQuestions = exam.questions || []
      const updated = existingQuestions.filter((_: any, i: number) => i !== questionIndex)
      await api.updateExam(examId, {
        questions: updated.map((q: any) => ({
          questionText: q.questionText,
          explanation: q.explanation,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          points: q.points,
        })),
      })
      loadExam()
    } catch (err: any) { alert(err.message) }
  }

  const handleTogglePublish = async () => {
    if (!examId) return
    try {
      await api.togglePublishExam(examId)
      loadExam()
    } catch (err: any) { alert(err.message) }
  }

  const handleDelete = async () => {
    if (!examId || !confirm('Delete this exam and all its attempts?')) return
    try {
      await api.deleteExam(examId)
      navigate('/teacher/exams')
    } catch (err: any) { alert(err.message) }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options]
    newOptions[index] = value
    setQuestionForm({ ...questionForm, options: newOptions })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='text-center py-16'>
        <p className='text-gray-500 font-semibold'>Exam not found</p>
        <button onClick={() => navigate('/teacher/exams')} className='mt-4 text-sm text-[#B8860B] font-semibold'>Back to Exams</button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <button onClick={() => navigate('/teacher/exams')} className='text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1'>
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' /></svg>
            Back to Exams
          </button>
          <h2 className='text-2xl font-bold text-[#1F2524]'>{exam.title}</h2>
          <p className='text-sm text-gray-400 mt-1'>
            {exam.subject?.name} · {exam.questions?.length ?? 0} questions · {exam.timeLimit ? `${Math.round(exam.timeLimit / 60)} min` : 'No time limit'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {exam.isPublished ? 'Published' : 'Draft'}
          </span>
          <button onClick={handleTogglePublish} className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${exam.isPublished ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
            {exam.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={handleDelete} className='px-4 py-2 text-sm font-semibold text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'>
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit'>
        {(['questions', 'attempts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${tab === t ? 'bg-[#1F2524] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {t} {t === 'questions' ? `(${exam.questions?.length ?? 0})` : `(${stats?.totalAttempts ?? 0})`}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className='space-y-3'>
          <div className='flex justify-end'>
            <button onClick={() => setShowAddQuestion(true)} className='px-4 py-2 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#996515] transition-colors'>
              + Add Question
            </button>
          </div>

          {(exam.questions ?? []).length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
              <p className='text-gray-500 font-semibold'>No questions yet</p>
              <p className='text-gray-400 text-sm mt-1'>Add questions to build your exam</p>
            </div>
          ) : (
            (exam.questions ?? []).map((q: any, idx: number) => (
              <div key={q.id || idx} className='bg-white rounded-2xl border border-gray-200 p-5'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-xs font-bold text-gray-400 mb-1'>Q{idx + 1} · {q.points} pt{q.points !== 1 ? 's' : ''}</p>
                    <p className='text-sm font-semibold text-[#1F2524]'>{q.questionText}</p>
                    <div className='mt-2 space-y-1'>
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${oi === q.correctAnswerIndex ? 'bg-green-50 text-green-700 font-semibold' : 'bg-slate-50 text-gray-500'}`}>
                          {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswerIndex ? '✓' : ''}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className='text-xs text-gray-400 mt-2 italic'>Explanation: {q.explanation}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteQuestion(idx)} className='p-2 text-slate-400 hover:text-red-500 transition-colors'>
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Attempts Tab */}
      {tab === 'attempts' && (
        <div className='space-y-4'>
          {stats && (
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-white rounded-2xl border border-gray-200 p-5'>
                <p className='text-sm text-gray-400 font-semibold'>Total Attempts</p>
                <p className='text-2xl font-bold text-[#1F2524] mt-1'>{stats.totalAttempts}</p>
              </div>
              <div className='bg-white rounded-2xl border border-gray-200 p-5'>
                <p className='text-sm text-gray-400 font-semibold'>Average Score</p>
                <p className='text-2xl font-bold text-[#1F2524] mt-1'>{stats.avgScore}%</p>
              </div>
            </div>
          )}

          {attempts.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
              <p className='text-gray-500 font-semibold'>No attempts yet</p>
            </div>
          ) : (
            <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-100 bg-slate-50/80'>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Student</th>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Score</th>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Time</th>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a.id} className='border-b border-gray-50 hover:bg-slate-50/50 transition-colors'>
                      <td className='px-5 py-3'>
                        <p className='text-sm font-semibold text-[#1F2524]'>{a.user?.name || 'Unknown'}</p>
                        <p className='text-xs text-gray-400'>{a.user?.email}</p>
                      </td>
                      <td className='px-5 py-3'>
                        <span className={`text-sm font-bold ${a.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                          {a.score}%
                        </span>
                      </td>
                      <td className='px-5 py-3 text-sm text-gray-500'>
                        {a.timeSpent ? `${Math.round(a.timeSpent / 60)}m ${a.timeSpent % 60}s` : '-'}
                      </td>
                      <td className='px-5 py-3 text-sm text-gray-500'>
                        {new Date(a.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => setShowAddQuestion(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#1F2524]'>Add Question</h3>
              <button onClick={() => setShowAddQuestion(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <form onSubmit={handleAddQuestion} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Question</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  required
                  rows={2}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] resize-none'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Options</label>
                <div className='space-y-2'>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='correct'
                        checked={questionForm.correctAnswerIndex === i}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswerIndex: i })}
                        className='accent-green-600'
                      />
                      <input
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        required
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className='flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
                      />
                    </div>
                  ))}
                </div>
                <p className='text-[11px] text-gray-400 mt-1'>Select the correct answer</p>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Points</label>
                  <input
                    type='number'
                    value={questionForm.points}
                    onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    min={1}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Explanation</label>
                  <input
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
                  />
                </div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowAddQuestion(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' disabled={saving} className='flex-1 py-2.5 bg-[#1F2524] text-white font-semibold rounded-xl hover:bg-[#282F2E] text-sm disabled:opacity-50'>
                  {saving ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
