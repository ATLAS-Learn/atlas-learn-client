import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import RichTextEditor from '../../components/RichTextEditor'

export default function TeacherChapterDetail() {
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
    isFree: false, requiredScoreToUnlock: 0, externalLinks: [] as { title: string; url: string; type: string }[], keyPoints: '',
  })

  const loadAll = useCallback(async () => {
    if (!subjectId || !chapterId) return
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll() }, [loadAll])

  const reloadLessons = async () => {
    if (!subjectId || !chapterId) return
    const data = await api.getSubjectChapterLessons(subjectId, chapterId)
    setLessons(Array.isArray(data) ? data : data?.data || [])
  }

  const openLessonForm = (lesson?: any) => {
    if (lesson) {
      setEditingLesson(lesson)
      let links: { title: string; url: string; type: string }[] = []
      if (lesson.externalLinks) {
        try {
          const parsed = typeof lesson.externalLinks === 'string' ? JSON.parse(lesson.externalLinks) : lesson.externalLinks
          links = Array.isArray(parsed) ? parsed : []
        } catch { links = [] }
      }
      setLessonForm({
        title: lesson.title || '', content: lesson.content || '', videoUrl: lesson.videoUrl || '',
        pdfUrl: lesson.pdfUrl || '', durationMinutes: lesson.durationMinutes || 15,
        orderIndex: lesson.orderIndex || 1, isFree: lesson.isFree || false,
        requiredScoreToUnlock: lesson.requiredScoreToUnlock || 0,
        externalLinks: links,
        keyPoints: lesson.keyPoints?.join('\n') || '',
      })
    } else {
      setEditingLesson(null)
      setLessonForm({
        title: '', content: '', videoUrl: '', pdfUrl: '', durationMinutes: 15,
        orderIndex: (lessons.length || 0) + 1, isFree: false, requiredScoreToUnlock: 0,
        externalLinks: [], keyPoints: '',
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
    if (lessonForm.externalLinks.length > 0) {
      payload.externalLinks = lessonForm.externalLinks.filter(l => l.url.trim())
    }
    try {
      if (editingLesson) {
        await api.updateLesson(subjectId, chapterId, editingLesson.id, payload)
      } else {
        await api.createLesson(subjectId, chapterId, payload)
      }
      setShowLessonForm(false)
      setEditingLesson(null)
      reloadLessons()
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!subjectId || !chapterId || !confirm('Delete this lesson?')) return
    try {
      await api.deleteLesson(subjectId, chapterId, lessonId)
      reloadLessons()
    } catch (err: any) { alert(err.message) }
  }

  const sortedLessons = [...lessons].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#084A59] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading chapter...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3 text-sm text-gray-400 mb-2'>
        <button onClick={() => navigate(`/teacher/content/${subjectId}`)} className='hover:text-[#084A59] transition-colors font-medium'>&larr; Back to Subject</button>
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
          <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Lessons</span>
          <button onClick={() => openLessonForm()} className='px-4 py-2 bg-[#084A59] text-white text-xs font-bold rounded-xl hover:bg-[#011C26] transition-colors'>+ Lesson</button>
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
                        {lesson.durationMinutes && <span className='text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded'>{lesson.durationMinutes} min</span>}
                        {lesson.isFree && <span className='text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Free</span>}
                        {lesson.videoUrl && <span className='text-xs text-[#084A59] bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Has Video</span>}
                        {lesson.pdfUrl && <span className='text-xs text-[#084A59] bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Has PDF</span>}
                        {lesson.externalLinks && <span className='text-xs text-[#084A59] bg-slate-50 px-1.5 py-0.5 rounded font-semibold'>Has Links</span>}
                      </div>
                      {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                        <div className='mt-2 flex flex-wrap gap-1'>
                          {lesson.keyPoints.slice(0, 3).map((kp: string, ki: number) => (
                            <span key={ki} className='text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded'>{kp}</span>
                          ))}
                          {lesson.keyPoints.length > 3 && <span className='text-xs text-gray-400'>+{lesson.keyPoints.length - 3} more</span>}
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
          <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Quizzes</span>
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
                </div>
                {quiz.questions && quiz.questions.length > 0 && (
                  <div className='border-t border-gray-100 divide-y divide-gray-50'>
                    {quiz.questions.map((q: any, qi: number) => (
                      <div key={q.id || qi} className='px-5 py-3 hover:bg-gray-50/50 transition-colors'>
                        <div className='flex-1 min-w-0'>
                          <p className='text-xs font-medium text-[#084A59]'><span className='text-gray-400 mr-1'>Q{qi + 1}.</span>{q.question}</p>
                          {q.options && (
                            <div className='flex flex-wrap gap-x-3 gap-y-0.5 mt-1 ml-4'>
                              {q.options.map((opt: string, oi: number) => (
                                <span key={oi} className={`text-xs ${oi === q.correctAnswer ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>{String.fromCharCode(65 + oi)}. {opt}</span>
                              ))}
                            </div>
                          )}
                          {q.explanation && <p className='text-xs text-gray-400 mt-1 ml-4 italic'>Explanation: {q.explanation}</p>}
                          {q.points && <span className='text-xs font-semibold text-[#084A59] ml-4'>{q.points} pt{q.points !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {showLessonForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => { setShowLessonForm(false); setEditingLesson(null) }}>
          <div className='bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editingLesson ? 'Edit Lesson' : 'New Lesson'}</h3>
              <button onClick={() => { setShowLessonForm(false); setEditingLesson(null) }} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'><svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg></button>
            </div>
            <form onSubmit={handleLessonSubmit} className='px-6 py-5 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title *</label><input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Content</label><RichTextEditor value={lessonForm.content} onChange={val => setLessonForm({ ...lessonForm, content: val })} placeholder='Write your lesson content here...' minHeight='200px' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Video URL</label><input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder='https://...' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>PDF URL</label><input value={lessonForm.pdfUrl} onChange={e => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })} placeholder='https://...' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Order *</label><input type='number' value={lessonForm.orderIndex} onChange={e => setLessonForm({ ...lessonForm, orderIndex: Number(e.target.value) })} required min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Duration (min)</label><input type='number' value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })} min={1} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Unlock Score %</label><input type='number' value={lessonForm.requiredScoreToUnlock} onChange={e => setLessonForm({ ...lessonForm, requiredScoreToUnlock: Number(e.target.value) })} min={0} max={100} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all' /></div>
                <div className='col-span-2'><label className='flex items-center gap-2 cursor-pointer'><input type='checkbox' checked={lessonForm.isFree} onChange={e => setLessonForm({ ...lessonForm, isFree: e.target.checked })} className='w-4 h-4 accent-[#084A59] rounded' /><span className='text-sm font-semibold text-gray-700'>Free lesson (no unlock required)</span></label></div>
                <div className='col-span-2'>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>External Links</label>
                  <div className='space-y-2'>
                    {lessonForm.externalLinks.map((link, i) => (
                      <div key={i} className='flex items-center gap-2'>
                        <input value={link.title} onChange={e => { const newLinks = [...lessonForm.externalLinks]; newLinks[i] = { ...newLinks[i], title: e.target.value }; setLessonForm({ ...lessonForm, externalLinks: newLinks }) }} placeholder='Title' className='w-1/4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59]' />
                        <input value={link.url} onChange={e => { const newLinks = [...lessonForm.externalLinks]; newLinks[i] = { ...newLinks[i], url: e.target.value }; setLessonForm({ ...lessonForm, externalLinks: newLinks }) }} placeholder='https://...' className='flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59]' />
                        <select value={link.type} onChange={e => { const newLinks = [...lessonForm.externalLinks]; newLinks[i] = { ...newLinks[i], type: e.target.value }; setLessonForm({ ...lessonForm, externalLinks: newLinks }) }} className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59]'>
                          <option value='article'>Article</option>
                          <option value='video'>Video</option>
                          <option value='reference'>Reference</option>
                        </select>
                        <button type='button' onClick={() => setLessonForm({ ...lessonForm, externalLinks: lessonForm.externalLinks.filter((_, j) => j !== i) })} className='p-2 text-red-400 hover:text-red-600'><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg></button>
                      </div>
                    ))}
                    <button type='button' onClick={() => setLessonForm({ ...lessonForm, externalLinks: [...lessonForm.externalLinks, { title: '', url: '', type: 'article' }] })} className='text-xs font-semibold text-[#084A59] hover:text-[#011C26]'>+ Add Link</button>
                  </div>
                </div>
                <div className='col-span-2'><label className='block text-sm font-semibold text-gray-700 mb-1.5'>Key Points (one per line)</label><textarea value={lessonForm.keyPoints} onChange={e => setLessonForm({ ...lessonForm, keyPoints: e.target.value })} rows={3} placeholder='Key concept 1&#10;Key concept 2' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none' /></div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => { setShowLessonForm(false); setEditingLesson(null) }} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#084A59] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'>{editingLesson ? 'Update Lesson' : 'Create Lesson'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
