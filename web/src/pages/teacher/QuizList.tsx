import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function QuizList() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Record<string, any[]>>({})
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<Record<string, any[]>>({})
  const [showQuizForm, setShowQuizForm] = useState<string | null>(null)
  const [quizForm, setQuizForm] = useState({ title: '', description: '', timeLimit: 30 })

  useEffect(() => { loadSubjects() }, [])

  const loadSubjects = async () => {
    try {
      const res: any = await api.getSubjects({ includeChapters: true })
      setSubjects(Array.isArray(res) ? res : res?.data || [])
    } catch {} finally { setLoading(false) }
  }

  const toggleSubject = async (subjectId: string) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null)
      setExpandedChapter(null)
      return
    }
    setExpandedSubject(subjectId)
    setExpandedChapter(null)
    if (!chapters[subjectId]) {
      try {
        const data = await api.getChapters({ subjectId })
        setChapters(prev => ({ ...prev, [subjectId]: Array.isArray(data) ? data : [] }))
      } catch {}
    }
  }

  const toggleChapter = async (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null)
      return
    }
    setExpandedChapter(chapterId)
    if (!quizzes[chapterId]) {
      try {
        const data = await api.getChapterQuizzes(chapterId)
        setQuizzes(prev => ({ ...prev, [chapterId]: Array.isArray(data) ? data : data?.data || [] }))
      } catch { setQuizzes(prev => ({ ...prev, [chapterId]: [] })) }
    }
  }

  const reloadQuizzes = async (chapterId: string) => {
    try {
      const data = await api.getChapterQuizzes(chapterId)
      setQuizzes(prev => ({ ...prev, [chapterId]: Array.isArray(data) ? data : data?.data || [] }))
    } catch {}
  }

  const openQuizForm = (chapterId: string) => {
    setQuizForm({ title: '', description: '', timeLimit: 30 })
    setShowQuizForm(chapterId)
  }

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showQuizForm) return
    try {
      const newQuiz = await api.createQuiz(showQuizForm, quizForm)
      setShowQuizForm(null)
      setQuizForm({ title: '', description: '', timeLimit: 30 })
      if (showQuizForm) reloadQuizzes(showQuizForm)
      const createdQuiz = newQuiz as any
      if (createdQuiz?.id) {
        navigate(`/teacher/quizzes/${createdQuiz.id}`, { state: { quiz: createdQuiz, chapterId: showQuizForm } })
      }
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteQuiz = async (quizId: string, chapterId: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return
    try {
      await api.deleteQuiz(quizId)
      reloadQuizzes(chapterId)
    } catch (err: any) { alert(err.message) }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-[#1F2524]'>Quiz Management</h2>
        <p className='text-sm text-gray-400 mt-0.5'>Browse quizzes by subject and chapter</p>
      </div>

      {subjects.length === 0 ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
          <p className='text-gray-500 font-semibold text-lg'>No subjects available</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {subjects.map((subject, idx) => (
            <div key={subject.id} className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
              <div
                className='flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors'
                onClick={() => toggleSubject(subject.id)}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm'>
                    {subject.code?.slice(0, 2) || subject.name?.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className='font-bold text-[#1F2524]'>{subject.name}</h3>
                    <p className='text-xs text-gray-400 font-medium'>
                      {subject.code} &middot; {chapters[subject.id]?.length ?? subject.chapters?.length ?? 0} chapters
                    </p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSubject === subject.id ? 'rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
                </svg>
              </div>

              {expandedSubject === subject.id && (
                <div className='border-t border-gray-100 px-5 py-3'>
                  {(chapters[subject.id] ?? []).length === 0 ? (
                    <p className='text-sm text-gray-400 py-4 text-center'>No chapters</p>
                  ) : (
                    <div className='space-y-2'>
                      {(chapters[subject.id] ?? [])
                        .sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
                        .map((ch: any) => (
                          <div key={ch.id} className='border border-gray-100 rounded-xl overflow-hidden'>
                            <div
                              className='flex items-center justify-between px-4 py-3 bg-slate-50/80 cursor-pointer hover:bg-gray-100/80 transition-colors'
                              onClick={() => toggleChapter(ch.id)}
                            >
                              <div className='flex items-center gap-2.5'>
                                <span className='w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center'>
                                  {ch.orderIndex}
                                </span>
                                <div>
                                  <p className='text-sm font-bold text-[#1F2524]'>{ch.title}</p>
                                  <p className='text-[11px] text-gray-400'>
                                    {quizzes[ch.id]?.length ?? ch._count?.quizzes ?? 0} quizzes
                                  </p>
                                </div>
                              </div>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedChapter === ch.id ? 'rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
                              </svg>
                            </div>

                            {expandedChapter === ch.id && (
                              <div className='px-4 py-3 bg-white space-y-3'>
                                <div className='flex items-center justify-between'>
                                  <p className='text-[11px] font-bold text-gray-400 uppercase tracking-wider'>Quizzes</p>
                                  <button
                                    onClick={() => openQuizForm(ch.id)}
                                    className='px-3 py-1 bg-[#F2B138] text-white text-xs font-bold rounded-lg hover:bg-[#996515] transition-colors'
                                  >
                                    + New Quiz
                                  </button>
                                </div>
                                {(quizzes[ch.id] ?? []).length === 0 ? (
                                  <p className='text-xs text-gray-400 py-3 text-center'>No quizzes yet</p>
                                ) : (
                                  (quizzes[ch.id] ?? []).map((quiz: any) => (
                                    <div key={quiz.id} className='border border-gray-100 rounded-xl overflow-hidden'>
                                      <div className='flex items-center justify-between px-4 py-3 bg-slate-50/80'>
                                        <div>
                                          <p className='text-sm font-bold text-[#1F2524]'>{quiz.title}</p>
                                          <p className='text-[10px] text-gray-400'>
                                            {quiz.timeLimit ? `${quiz.timeLimit} min` : ''} · {quiz.questions?.length ?? quiz._count?.questions ?? 0} questions
                                          </p>
                                        </div>
                                        <div className='flex gap-1.5'>
                                          <button
                                            onClick={() => navigate(`/teacher/quizzes/${quiz.id}`, { state: { quiz, chapterId: ch.id } })}
                                            className='px-2.5 py-1.5 text-xs font-semibold text-[#B8860B] border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-600 transition-colors'
                                          >
                                            View Details
                                          </button>
                                          <button
                                            onClick={() => handleDeleteQuiz(quiz.id, ch.id)}
                                            className='px-2.5 py-1.5 text-xs font-semibold text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-600 transition-colors'
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showQuizForm && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => setShowQuizForm(null)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#1F2524]'>New Quiz</h3>
              <button onClick={() => setShowQuizForm(null)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <form onSubmit={handleQuizSubmit} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title</label>
                <input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all' />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label>
                <textarea value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} rows={2} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all resize-none' />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Time Limit (minutes)</label>
                <input type='number' value={quizForm.timeLimit} onChange={e => setQuizForm({ ...quizForm, timeLimit: Number(e.target.value) })} min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all' />
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowQuizForm(null)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#1F2524] text-white font-semibold rounded-xl hover:bg-[#282F2E] transition-colors text-sm'>Create Quiz</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
