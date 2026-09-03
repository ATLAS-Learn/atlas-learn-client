import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function SubjectList() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const loadSubjects = useCallback(async () => {
    try {
      const data = await api.getSubjects({ includeChapters: true })
      setSubjects(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSubjects() }, [loadSubjects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await api.updateSubject(editingId, form) }
    else { await api.createSubject(form) }
    setForm({ name: '', code: '', description: '' })
    setEditingId(null)
    setShowForm(false)
    loadSubjects()
  }

  const handleEdit = (e: React.MouseEvent, s: any) => {
    e.stopPropagation()
    setForm({ name: s.name, code: s.code, description: s.description || '' })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this subject and all its chapters/lessons/quizzes?')) return
    await api.deleteSubject(id)
    loadSubjects()
  }

  const handleCardClick = (subjectId: string) => {
    navigate(`/admin/subjects/${subjectId}`)
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-[#084A59]'>Subjects</h2>
          <p className='text-sm text-gray-400 mt-0.5'>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} &middot; Subjects → Chapters → Lessons → Quizzes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', description: '' }) }} className='px-5 py-2.5 bg-[#084A59] text-white font-bold text-sm rounded-xl hover:bg-[#011C26] transition-colors'>+ New Subject</button>
      </div>

      {loading ? (
        <div className='flex items-center justify-center h-40'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
            <p className='text-sm text-gray-400'>Loading subjects...</p>
          </div>
        </div>
      ) : subjects.length === 0 ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
          <p className='text-gray-500 font-semibold text-lg'>No subjects yet</p>
          <p className='text-sm text-gray-400 mt-1'>Create your first subject to get started.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {subjects.map((s, _idx) => (
            <div
              key={s.id}
              onClick={() => handleCardClick(s.id)}
              className='bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
            >
              <div className='p-5'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm'>
                      {s.code?.slice(0, 2) || s.name?.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className='font-bold text-[#084A59]'>{s.name}</h3>
                      <p className='text-xs text-gray-400 font-medium'>{s.code}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1' onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleEdit(e, s)} className='p-1.5 rounded-lg text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'>
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' />
                      </svg>
                    </button>
                    <button onClick={(e) => handleDelete(e, s.id)} className='p-1.5 rounded-lg text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'>
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                      </svg>
                    </button>
                  </div>
                </div>
                {s.description && (
                  <p className='text-sm text-gray-400 mt-3 line-clamp-2'>{s.description}</p>
                )}
                <div className='mt-3 pt-3 border-t border-gray-100'>
                  <p className='text-xs text-gray-400 font-medium'>
                    {s.chapters?.length ?? 0} chapter{(s.chapters?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subject Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setShowForm(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editingId ? 'Edit Subject' : 'New Subject'}</h3>
              <button onClick={() => setShowForm(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Code</label>
                <input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none'
                />
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowForm(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#084A59] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'>{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
