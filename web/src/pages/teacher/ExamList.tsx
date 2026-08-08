import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function ExamList() {
  const navigate = useNavigate()
  const [exams, setExams] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    timeLimit: 60,
    subjectId: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadSubjects() }, [])
  useEffect(() => { loadExams() }, [filterSubject])

  const loadSubjects = async () => {
    try {
      const subjectsRes = await api.getExamSubjects()
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : [])
    } catch (err) { console.error('Failed to load subjects:', err) }
  }

  const loadExams = async () => {
    setLoading(true)
    try {
      const examsRes = await api.getExams({ subjectId: filterSubject || undefined })
      setExams(examsRes?.data || [])
    } catch (err) { console.error('Failed to load exams:', err) }
    finally { setLoading(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title || !createForm.subjectId) return
    setCreating(true)
    try {
      const res: any = await api.createExam({
        title: createForm.title,
        description: createForm.description || undefined,
        timeLimit: createForm.timeLimit ? createForm.timeLimit * 60 : undefined,
        subjectId: createForm.subjectId,
        questions: [],
      })
      setShowCreateModal(false)
      setCreateForm({ title: '', description: '', timeLimit: 60, subjectId: '' })
      if (res?.data?.id) {
        navigate(`/teacher/exams/${res.data.id}`)
      }
    } catch (err: any) { alert(err.message) }
    finally { setCreating(false) }
  }

  const handleTogglePublish = async (examId: string) => {
    try {
      await api.togglePublishExam(examId)
      loadExams()
    } catch (err: any) { alert(err.message) }
  }

  const handleDelete = async (examId: string) => {
    if (!confirm('Delete this exam and all its attempts?')) return
    try {
      await api.deleteExam(examId)
      loadExams()
    } catch (err: any) { alert(err.message) }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading exams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-[#1F2524]'>Exam Management</h2>
          <p className='text-sm text-gray-400 mt-0.5'>Create and manage subject exams</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className='px-4 py-2.5 bg-[#1F2524] text-white text-sm font-bold rounded-xl hover:bg-[#282F2E] transition-colors'
        >
          + New Exam
        </button>
      </div>

      {/* Filter */}
      <div className='bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4'>
        <label className='text-sm font-semibold text-gray-600'>Subject:</label>
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className='px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
        >
          <option value=''>All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s._count?.exams ?? 0})</option>
          ))}
        </select>
      </div>

      {/* Exam list */}
      {exams.length === 0 ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
          <p className='text-gray-500 font-semibold text-lg'>No exams yet</p>
          <p className='text-gray-400 text-sm mt-1'>Create your first exam to get started</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {exams.map(exam => (
            <div key={exam.id} className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
              <div className='flex items-center justify-between px-5 py-4'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center'>
                    <svg className='w-6 h-6 text-slate-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0' />
                    </svg>
                  </div>
                  <div>
                    <h3 className='font-bold text-[#1F2524] text-lg'>{exam.title}</h3>
                    <p className='text-sm text-gray-400'>
                      {exam.subject?.name || 'Unknown Subject'} · {exam._count?.questions ?? 0} questions · {exam.timeLimit ? `${Math.round(exam.timeLimit / 60)} min` : 'No time limit'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className='text-sm text-gray-400 font-medium'>
                    {exam._count?.attempts ?? 0} attempts
                  </span>
                </div>
              </div>
              <div className='flex gap-2 px-5 pb-4'>
                <button
                  onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                  className='px-3 py-1.5 text-xs font-semibold text-[#B8860B] border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
                >
                  View Details
                </button>
                <button
                  onClick={() => handleTogglePublish(exam.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    exam.isPublished
                      ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }`}
                >
                  {exam.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className='px-3 py-1.5 text-xs font-semibold text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => setShowCreateModal(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#1F2524]'>New Exam</h3>
              <button onClick={() => setShowCreateModal(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title</label>
                <input
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                  placeholder='e.g. Midterm Exam'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Subject</label>
                <select
                  value={createForm.subjectId}
                  onChange={e => setCreateForm({ ...createForm, subjectId: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                >
                  <option value=''>Select subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all resize-none'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Time Limit (minutes)</label>
                <input
                  type='number'
                  value={createForm.timeLimit}
                  onChange={e => setCreateForm({ ...createForm, timeLimit: Number(e.target.value) })}
                  min={1}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                />
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowCreateModal(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>Cancel</button>
                <button type='submit' disabled={creating} className='flex-1 py-2.5 bg-[#1F2524] text-white font-semibold rounded-xl hover:bg-[#282F2E] transition-colors text-sm disabled:opacity-50'>
                  {creating ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
