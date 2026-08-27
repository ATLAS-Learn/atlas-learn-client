import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function AdminChapterDetail() {
  const { subjectId, chapterId } = useParams<{ subjectId: string; chapterId: string }>()
  const navigate = useNavigate()

  const [chapter, setChapter] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '', content: '', videoUrl: '', pdfUrl: '', durationMinutes: 15, orderIndex: 1,
    isFree: false, requiredScoreToUnlock: 0, externalLinks: '', keyPoints: '',
  })

  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<any>(null)
  const [quizForm, setQuizForm] = useState({ title: '', description: '', timeLimit: 30 })

  const [showQuestionForm, setShowQuestionForm] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 1 })

  const loadAll = useCallback(async () => {
    if (!subjectId || !chapterId) return
    setLoading(true)
    try {
      const [chData, lData, qData] = await Promise.all([
        api.getChapter(chapterId),
        api.getSubjectChapterLessons(subjectId, chapterId),
        api.getChapterQuizzes(chapterId),
      ])
      setChapter(chData)
      setLessons(Array.isArray(lData) ? lData : lData?.data || [])
      setQuizzes(Array.isArray(qData) ? qData : qData?.data || [])
    } catch {} finally { setLoading(false) }
  }, [subjectId, chapterId])

  useEffect(() => { loadAll() }, [loadAll])

  const reloadLessons = async () => {
    if (!subjectId || !chapterId) return
    const data = await api.getSubjectChapterLessons(subjectId, chapterId)
    setLessons(Array.isArray(data) ? data : data?.data || [])
  }

  const reloadQuizzes = async () => {
    if (!chapterId) return
    const data = await api.getChapterQuizzes(chapterId)
    setQuizzes(Array.isArray(data) ? data : data?.data || [])
  }

  const openLessonForm = (lesson?: any) => {
    if (lesson) {
      setEditingLesson(lesson)
      setLessonForm({
        title: lesson.title || '', content: lesson.content || '', videoUrl: lesson.videoUrl || '',
        pdfUrl: lesson.pdfUrl || '', durationMinutes: lesson.durationMinutes || 15,
        orderIndex: lesson.orderIndex || 1, isFree: lesson.isFree || false,
        requiredScoreToUnlock: lesson.requiredScoreToUnlock || 0,
        externalLinks: lesson.externalLinks ? JSON.stringify(lesson.externalLinks, null, 2) : '',
        keyPoints: lesson.keyPoints?.join('\n') || '',
      })
    } else {
      setEditingLesson(null)
      setLessonForm({
        title: '', content: '', videoUrl: '', pdfUrl: '', durationMinutes: 15,
        orderIndex: (lessons.length || 0) + 1, isFree: false, requiredScoreToUnlock: 0,
        externalLinks: '', keyPoints: '',
      })
    }
    setShowLessonForm(true)
  }

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !chapterId) return
    const payload: any = {
      title: lessonForm.title, content: lessonForm.content || undefined,
      videoUrl: lessonForm.videoUrl || undefined, pdfUrl: lessonForm.pdfUrl || undefined,
      durationMinutes: lessonForm.durationMinutes, orderIndex: lessonForm.orderIndex,
      isFree: lessonForm.isFree, requiredScoreToUnlock: lessonForm.requiredScoreToUnlock,
      keyPoints: lessonForm.keyPoints ? lessonForm.keyPoints.split('\n').filter(Boolean) : [],
    }
    if (lessonForm.externalLinks) {
      try { payload.externalLinks = JSON.parse(lessonForm.externalLinks) } catch {}
    }
    if (editingLesson) {
      await api.updateLesson(subjectId, chapterId, editingLesson.id, payload)
    } else {
      await api.createLesson(subjectId, chapterId, payload)
    }
    setShowLessonForm(false)
    setEditingLesson(null)
    reloadLessons()
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!subjectId || !chapterId || !confirm('Delete this lesson?')) return
    await api.deleteLesson(subjectId, chapterId, lessonId)
    reloadLessons()
  }

  const openQuizForm = (quiz?: any) => {
    if (quiz) {
      setEditingQuiz(quiz)
      setQuizForm({ title: quiz.title || '', description: quiz.description || '', timeLimit: quiz.timeLimit || 30 })
    } else {
      setEditingQuiz(null)
      setQuizForm({ title: '', description: '', timeLimit: 30 })
    }
    setShowQuizForm(true)
  }

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chapterId) return
    try {
      if (editingQuiz) {
        await api.updateQuiz(editingQuiz.id, quizForm)
      } else {
        await api.createQuiz(chapterId, quizForm)
      }
      setShowQuizForm(false)
      setEditingQuiz(null)
      setQuizForm({ title: '', description: '', timeLimit: 30 })
      reloadQuizzes()
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return
    try { await api.deleteQuiz(quizId); reloadQuizzes() } catch (err: any) { alert(err.message) }
  }

  const openQuestionForm = (quizId: string, question?: any) => {
    if (question) {
      setEditingQuestion(question)
      setQuestionForm({
        question: question.question || '', options: question.options || ['', '', '', ''],
        correctAnswer: question.correctAnswer ?? 0, explanation: question.explanation || '',
        points: question.points || 1,
      })
    } else {
      setEditingQuestion(null)
      setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 1 })
    }
    setShowQuestionForm(quizId)
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showQuestionForm) return
    try {
      if (editingQuestion) {
        await api.updateQuestion(showQuestionForm, editingQuestion.id, questionForm)
      } else {
        await api.addQuestion(showQuestionForm, questionForm)
      }
      setShowQuestionForm(null)
      setEditingQuestion(null)
      setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 1 })
      reloadQuizzes()
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteQuestion = async (quizId: string, questionId: string) => {
    if (!confirm('Delete this question?')) return
    try { await api.deleteQuestion(quizId, questionId); reloadQuizzes() } catch (err: any) { alert(err.message) }
  }

  const sortedLessons = [...lessons].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))

  if (loading) {
    return <div className='flex items-center justify-center h-40 text-gray-400'>Loading...</div>
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3 text-sm text-gray-400 mb-2'>
        <button onClick={() => navigate(`/admin/subjects/${subjectId}`)} className='hover:text-[#084A59] transition-colors font-medium'>← Back to Subject</button>
      </div>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-[#084A59]'>{chapter?.title || 'Chapter'}</h2>
          <p className='text-sm text-gray-400 mt-0.5'>Order #{chapter?.orderIndex} &middot; {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} &middot; {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
        </div>
      </div>

      {/* Lessons Section */}
      <div>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-[11px] font-bold text-gray-400 uppercase tracking-wider'>Lessons</span>
          <button onClick={() => openLessonForm()} className='px-4 py-2 bg-[#F2B138] text-white text-xs font-bold rounded-xl hover:bg-[#011C26] transition-colors'>+ Lesson</button>
        </div>
        {sortedLessons.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
            <p className='text-gray-400 font-medium'>No lessons yet</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {sortedLessons.map((lesson: any) => (
              <div key={lesson.id} className='bg-white rounded-2xl border border-gray-200 p-4 hover:bg-gray-50/50 transition-colors'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-3 min-w-0 flex-1'>
                    <span className='w-8 h-8 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5'>{lesson.orderIndex}</span>
                    <div className='min-w-0 flex-1'>
                      <h4 className='font-bold text-[#084A59] text-sm'>{lesson.title}</h4>
                      {lesson.content && <p className='text-xs text-gray-400 mt-1 line-clamp-2'>{lesson.content}</p>}
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {lesson.durationMinutes && <span className='text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded'>{lesson.durationMinutes} min</span>}
                        {lesson.isFree && <span className='text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Free</span>}
                        {lesson.videoUrl && <span className='text-[10px] text-[#084A59] bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Has Video</span>}
                        {lesson.pdfUrl && <span className='text-[10px] text-[#084A59] bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Has PDF</span>}
                        {lesson.externalLinks && <span className='text-[10px] text-[#084A59] bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Has Links</span>}
                      </div>
                      {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                        <div className='mt-2 flex flex-wrap gap-1'>
                          {lesson.keyPoints.slice(0, 3).map((kp: string, ki: number) => (
                            <span key={ki} className='text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded'>{kp}</span>
                          ))}
                          {lesson.keyPoints.length > 3 && <span className='text-[10px] text-gray-400'>+{lesson.keyPoints.length - 3} more</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-1 flex-shrink-0 ml-2'>
                    <button onClick={() => openLessonForm(lesson)} className='p-1.5 rounded-lg text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' /></svg></button>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className='p-1.5 rounded-lg text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quizzes Section */}
      <div>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-[11px] font-bold text-gray-400 uppercase tracking-wider'>Quizzes</span>
          <button onClick={() => openQuizForm()} className='px-4 py-2 bg-[#F2B138] text-white text-xs font-bold rounded-xl hover:bg-[#011C26] transition-colors'>+ Quiz</button>
        </div>
        {quizzes.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
            <p className='text-gray-400 font-medium'>No quizzes yet</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {quizzes.map((quiz: any) => (
              <div key={quiz.id} className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                <div className='flex items-center justify-between px-5 py-4'>
                  <div>
                    <h4 className='font-bold text-[#084A59] text-sm'>{quiz.title}</h4>
                    <p className='text-xs text-gray-400 mt-0.5'>{quiz.timeLimit ? `${quiz.timeLimit} min` : ''} &middot; {quiz.questions?.length ?? quiz._count?.questions ?? 0} questions</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button onClick={() => openQuizForm(quiz)} className='p-1.5 rounded-lg text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' /></svg></button>
                    <button onClick={() => handleDeleteQuiz(quiz.id)} className='p-1.5 rounded-lg text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg></button>
                  </div>
                </div>
                {quiz.questions && quiz.questions.length > 0 && (
                  <div className='border-t border-gray-100 divide-y divide-gray-50'>
                    {quiz.questions.map((q: any, qi: number) => (
                      <div key={q.id || qi} className='px-5 py-3 hover:bg-gray-50/50 transition-colors'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1 min-w-0'>
                            <p className='text-xs font-medium text-[#084A59]'><span className='text-gray-400 mr-1'>Q{qi + 1}.</span>{q.question}</p>
                            {q.options && (
                              <div className='flex flex-wrap gap-x-3 gap-y-0.5 mt-1 ml-4'>
                                {q.options.map((opt: string, oi: number) => (
                                  <span key={oi} className={`text-[11px] ${oi === q.correctAnswer ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>{String.fromCharCode(65 + oi)}. {opt}</span>
                                ))}
                              </div>
                            )}
                            {q.explanation && <p className='text-[10px] text-gray-400 mt-1 ml-4 italic'>Explanation: {q.explanation}</p>}
                            {q.points && <span className='text-[9px] font-semibold text-[#084A59] ml-4'>{q.points} pt{q.points !== 1 ? 's' : ''}</span>}
                          </div>
                          <div className='flex gap-0.5 flex-shrink-0'>
                            <button onClick={() => openQuestionForm(quiz.id, q)} className='p-0.5 rounded text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'><svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' /></svg></button>
                            <button onClick={() => handleDeleteQuestion(quiz.id, q.id)} className='p-0.5 rounded text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'><svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className='border-t border-gray-100 px-5 py-2'>
                  <button onClick={() => openQuestionForm(quiz.id)} className='px-3 py-1 bg-[#F2B138] text-white text-[10px] font-bold rounded-lg hover:bg-[#011C26] transition-colors'>+ Question</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {showLessonForm && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => { setShowLessonForm(false); setEditingLesson(null) }}>
          <div className='bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editingLesson ? 'Edit Lesson' : 'New Lesson'}</h3>
              <button onClick={() => { setShowLessonForm(false); setEditingLesson(null) }} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'><svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg></button>
            </div>
            <form onSubmit={handleLessonSubmit} className='px-6 py-5 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title</label><input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Content</label><textarea value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} rows={4} placeholder='Lesson content (markdown supported)...' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Video URL</label><input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder='https://...' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>PDF URL</label><input value={lessonForm.pdfUrl} onChange={e => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })} placeholder='https://...' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Order Index</label><input type='number' value={lessonForm.orderIndex} onChange={e => setLessonForm({ ...lessonForm, orderIndex: Number(e.target.value) })} required min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Duration (min)</label><input type='number' value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })} min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Unlock Score %</label><input type='number' value={lessonForm.requiredScoreToUnlock} onChange={e => setLessonForm({ ...lessonForm, requiredScoreToUnlock: Number(e.target.value) })} min={0} max={100} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div className='col-span-2'><label className='flex items-center gap-2 cursor-pointer'><input type='checkbox' checked={lessonForm.isFree} onChange={e => setLessonForm({ ...lessonForm, isFree: e.target.checked })} className='w-4 h-4 accent-[#084A59] rounded' /><span className='text-sm font-semibold text-gray-700'>Free lesson (no unlock required)</span></label></div>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>External Links (JSON)</label><textarea value={lessonForm.externalLinks} onChange={e => setLessonForm({ ...lessonForm, externalLinks: e.target.value })} rows={3} placeholder='[{"title":"Link","url":"https://...","type":"article"}]' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none' /></div>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Key Points (one per line)</label><textarea value={lessonForm.keyPoints} onChange={e => setLessonForm({ ...lessonForm, keyPoints: e.target.value })} rows={3} placeholder='Key concept 1&#10;Key concept 2' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none' /></div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => { setShowLessonForm(false); setEditingLesson(null) }} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'>{editingLesson ? 'Update Lesson' : 'Create Lesson'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizForm && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => { setShowQuizForm(false); setEditingQuiz(null) }}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editingQuiz ? 'Edit Quiz' : 'New Quiz'}</h3>
              <button onClick={() => { setShowQuizForm(false); setEditingQuiz(null) }} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'><svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg></button>
            </div>
            <form onSubmit={handleQuizSubmit} className='px-6 py-5 space-y-4'>
              <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title</label><input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
              <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label><textarea value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} rows={2} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none' /></div>
              <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Time Limit (minutes)</label><input type='number' value={quizForm.timeLimit} onChange={e => setQuizForm({ ...quizForm, timeLimit: Number(e.target.value) })} min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => { setShowQuizForm(false); setEditingQuiz(null) }} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'>{editingQuiz ? 'Update Quiz' : 'Create Quiz'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionForm && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => { setShowQuestionForm(null); setEditingQuestion(null) }}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editingQuestion ? 'Edit Question' : 'Add Question'}</h3>
              <button onClick={() => { setShowQuestionForm(null); setEditingQuestion(null) }} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'><svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg></button>
            </div>
            <form onSubmit={handleQuestionSubmit} className='px-6 py-5 space-y-4'>
              <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Question</label><textarea value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} required rows={3} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none' /></div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Options (select correct answer)</label>
                <div className='space-y-2'>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className='flex items-center gap-3'>
                      <input type='radio' name='correctAnswer' checked={questionForm.correctAnswer === i} onChange={() => setQuestionForm({ ...questionForm, correctAnswer: i })} className='w-4 h-4 accent-[#084A59]' />
                      <input value={opt} onChange={e => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm({ ...questionForm, options: opts }) }} placeholder={`Option ${String.fromCharCode(65 + i)}`} required className='flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' />
                    </div>
                  ))}
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Points</label><input type='number' value={questionForm.points} onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Explanation</label><input value={questionForm.explanation} onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => { setShowQuestionForm(null); setEditingQuestion(null) }} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'>{editingQuestion ? 'Update Question' : 'Add Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
