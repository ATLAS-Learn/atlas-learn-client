import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import RichTextEditor from '../../components/RichTextEditor'

export default function AdminSubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()

  const [subject, setSubject] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showChapterForm, setShowChapterForm] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    unlockThreshold: 70,
    estimatedMinutes: 15,
  })

  const loadData = useCallback(async () => {
    if (!subjectId) return
    setLoading(true)
    try {
      const [subjectData, chaptersData] = await Promise.all([
        api.getSubjects({ includeChapters: true }),
        api.getChapters({ subjectId }),
      ])
      const subjects = Array.isArray(subjectData) ? subjectData : []
      setSubject(subjects.find((s: any) => s.id === subjectId) || null)
      setChapters(
        (Array.isArray(chaptersData) ? chaptersData : []).sort(
          (a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)
        )
      )
    } catch {} finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateChapter = () => {
    setEditingChapterId(null)
    setChapterForm({
      title: '',
      description: '',
      orderIndex: chapters.length + 1,
      unlockThreshold: 70,
      estimatedMinutes: 15,
    })
    setShowChapterForm(true)
  }

  const openEditChapter = (ch: any) => {
    setEditingChapterId(ch.id)
    setChapterForm({
      title: ch.title,
      description: ch.description || '',
      orderIndex: ch.orderIndex,
      unlockThreshold: ch.unlockThreshold ?? 70,
      estimatedMinutes: ch.estimatedMinutes ?? 15,
    })
    setShowChapterForm(true)
  }

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId) return
    const payload = { ...chapterForm, subjectId }
    if (editingChapterId) {
      await api.updateChapter(editingChapterId, payload)
    } else {
      await api.createChapter(payload)
    }
    setShowChapterForm(false)
    setEditingChapterId(null)
    loadData()
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Delete this chapter?')) return
    await api.deleteChapter(chapterId)
    loadData()
  }

  return (
    <div className='space-y-6'>
      {loading ? (
        <div className='flex items-center justify-center h-40'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
        </div>
      ) : !subject ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
          <p className='text-gray-500 font-semibold text-lg'>Subject not found</p>
        </div>
      ) : (
        <>
          <div>
            <button
              onClick={() => navigate('/admin/subjects')}
              className='text-sm text-gray-400 hover:text-[#084A59] font-medium transition-colors mb-3 inline-flex items-center gap-1'
            >
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
              </svg>
              Subjects
            </button>
            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center gap-3'>
                  <h2 className='text-2xl font-bold text-[#084A59]'>{subject.name}</h2>
                  <span className='text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg'>
                    {subject.code}
                  </span>
                </div>
                {subject.description && (
                  <p className='text-sm text-gray-400 mt-1 max-w-xl'>{subject.description}</p>
                )}
              </div>
              <button
                onClick={openCreateChapter}
                className='px-5 py-2.5 bg-[#F2B138] text-white font-bold text-sm rounded-xl hover:bg-[#011C26] transition-colors'
              >
                + Chapter
              </button>
            </div>
          </div>

          {chapters.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
              <p className='text-gray-500 font-semibold text-lg'>No chapters yet</p>
              <p className='text-sm text-gray-400 mt-1'>Add a chapter to get started.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {chapters.map((ch: any) => (
                <div
                  key={ch.id}
                  className='bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow cursor-pointer'
                  onClick={() => navigate(`/admin/subjects/${subjectId}/chapters/${ch.id}`)}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-start gap-3 min-w-0 flex-1'>
                      <span className='w-9 h-9 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold flex items-center justify-center flex-shrink-0'>
                        {ch.orderIndex}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <h3 className='font-bold text-[#084A59]'>{ch.title}</h3>
                        {ch.description && (
                          <p className='text-sm text-gray-400 mt-0.5 line-clamp-2'>{ch.description}</p>
                        )}
                        <div className='flex flex-wrap gap-3 mt-2'>
                          {ch.estimatedMinutes && (
                            <span className='text-xs text-gray-400 flex items-center gap-1'>
                              <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                              {ch.estimatedMinutes} min
                            </span>
                          )}
                          {ch._count?.lessons != null && (
                            <span className='text-xs text-gray-400'>
                              {ch._count.lessons} lesson{ch._count.lessons !== 1 ? 's' : ''}
                            </span>
                          )}
                          {ch._count?.quizzes != null && (
                            <span className='text-xs text-gray-400'>
                              {ch._count.quizzes} quiz{ch._count.quizzes !== 1 ? 'zes' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-1 flex-shrink-0'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditChapter(ch)
                        }}
                        className='p-2 rounded-lg text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'
                      >
                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChapter(ch.id)
                        }}
                        className='p-2 rounded-lg text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'
                      >
                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                        </svg>
                      </button>
                      <svg className='w-5 h-5 text-gray-300' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Chapter Modal */}
      {showChapterForm && (
        <div
          className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
          onClick={() => setShowChapterForm(false)}
        >
          <div
            className='bg-white rounded-2xl w-full max-w-lg shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>
                {editingChapterId ? 'Edit Chapter' : 'New Chapter'}
              </h3>
              <button
                onClick={() => setShowChapterForm(false)}
                className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'
              >
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <form onSubmit={handleChapterSubmit} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title</label>
                <input
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label>
                <RichTextEditor
                  value={chapterForm.description}
                  onChange={(val) => setChapterForm({ ...chapterForm, description: val })}
                  placeholder='Describe what this chapter covers...'
                  minHeight='120px'
                />
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Order</label>
                  <input
                    type='number'
                    value={chapterForm.orderIndex}
                    onChange={(e) => setChapterForm({ ...chapterForm, orderIndex: Number(e.target.value) })}
                    required
                    min={1}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Unlock %</label>
                  <input
                    type='number'
                    value={chapterForm.unlockThreshold}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, unlockThreshold: Number(e.target.value) })
                    }
                    min={0}
                    max={100}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Est. Min</label>
                  <input
                    type='number'
                    value={chapterForm.estimatedMinutes}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, estimatedMinutes: Number(e.target.value) })
                    }
                    min={1}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                  />
                </div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowChapterForm(false)}
                  className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'
                >
                  {editingChapterId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
