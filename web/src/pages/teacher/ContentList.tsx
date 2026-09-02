import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function ContentList() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editSubject, setEditSubject] = useState<any>(null)
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' })

  useEffect(() => { loadSubjects() }, [])

  const loadSubjects = async () => {
    try {
      const res: any = await api.getSubjects({ includeChapters: true })
      setSubjects(Array.isArray(res) ? res : res?.data || [])
    } catch {} finally { setLoading(false) }
  }

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editSubject) { await api.updateSubject(editSubject.id, subjectForm) }
      else { await api.createSubject(subjectForm) }
      setShowSubjectForm(false)
      setEditSubject(null)
      setSubjectForm({ name: '', code: '', description: '' })
      loadSubjects()
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all chapters, lessons, quizzes?')) return
    try { await api.deleteSubject(id); loadSubjects() } catch (err: any) { alert(err.message) }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#084A59] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-[#084A59]'>Content Browser</h2>
          <p className='text-sm text-gray-400 mt-0.5'>{subjects.length} subjects · Subjects → Chapters → Lessons → Quizzes</p>
        </div>
        <button
          onClick={() => { setEditSubject(null); setSubjectForm({ name: '', code: '', description: '' }); setShowSubjectForm(true) }}
          className='px-5 py-2.5 bg-[#084A59] text-white font-bold text-sm rounded-xl hover:bg-[#011C26] transition-colors'
        >
          + New Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
          <p className='text-gray-500 font-semibold text-lg'>No subjects available</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {subjects.map((subject, idx) => (
            <div
              key={subject.id}
              className='bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => navigate(`/teacher/content/${subject.id}`)}
            >
              <div className='p-5'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm'>
                    {subject.code?.slice(0, 2) || subject.name?.slice(0, 2)}
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditSubject(subject)
                        setSubjectForm({ name: subject.name, code: subject.code, description: subject.description || '' })
                        setShowSubjectForm(true)
                      }}
                      className='p-1.5 rounded-lg text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id) }}
                      className='p-1.5 rounded-lg text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className='font-bold text-[#084A59] text-lg mb-1'>{subject.name}</h3>
                <p className='text-xs text-gray-400 font-medium mb-2'>{subject.code} · {subject.chapters?.length ?? 0} chapters</p>
                {subject.description && (
                  <p className='text-sm text-gray-400 line-clamp-2'>{subject.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSubjectForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setShowSubjectForm(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editSubject ? 'Edit Subject' : 'New Subject'}</h3>
              <button onClick={() => setShowSubjectForm(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubjectSubmit} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Name</label>
                <input
                  value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Code</label>
                <input
                  value={subjectForm.code}
                  onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label>
                <textarea
                  value={subjectForm.description}
                  onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  rows={3}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none'
                />
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowSubjectForm(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#084A59] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm'>{editSubject ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
