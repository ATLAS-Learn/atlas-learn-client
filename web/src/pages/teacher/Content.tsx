import { useState, useEffect } from 'react'
import { api } from '../../api/client'

export default function TeacherContent() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Record<string, any[]>>({})
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editSubject, setEditSubject] = useState<any>(null)
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' })
  const [showChapterForm, setShowChapterForm] = useState<string | null>(null)
  const [chapterForm, setChapterForm] = useState({ title: '', description: '', orderIndex: 0, unlockThreshold: 50, estimatedMinutes: 30 })

  useEffect(() => { loadSubjects() }, [])

  const loadSubjects = async () => {
    try {
      const res: any = await api.getSubjects()
      setSubjects(Array.isArray(res) ? res : res?.data || [])
    } catch {} finally { setLoading(false) }
  }

  const loadChapters = async (subjectId: string) => {
    try {
      const res: any = await api.getSubjects({ includeChapters: true })
      const subject = (Array.isArray(res) ? res : res?.data || []).find((s: any) => s.id === subjectId)
      setChapters(prev => ({ ...prev, [subjectId]: subject?.chapters || [] }))
    } catch {}
  }

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editSubject) { await api.updateSubject(editSubject.id, subjectForm) }
      else { await api.createSubject(subjectForm) }
      setShowSubjectForm(false); setEditSubject(null); setSubjectForm({ name: '', code: '', description: '' }); loadSubjects()
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all its chapters, lessons, and quizzes?')) return
    try { await api.deleteSubject(id); loadSubjects() } catch (err: any) { alert(err.message) }
  }

  const handleChapterSubmit = async (e: React.FormEvent, subjectId: string) => {
    e.preventDefault()
    try {
      await api.createChapter({ ...chapterForm, subjectId })
      setShowChapterForm(null); setChapterForm({ title: '', description: '', orderIndex: 0, unlockThreshold: 50, estimatedMinutes: 30 }); loadChapters(subjectId)
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteChapter = async (chapterId: string, subjectId: string) => {
    if (!confirm('Delete this chapter and all its lessons and quizzes?')) return
    try { await api.deleteChapter(chapterId); loadChapters(subjectId) } catch (err: any) { alert(err.message) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2524]">Content Management</h1>
        <button onClick={() => { setShowSubjectForm(true); setEditSubject(null); setSubjectForm({ name: '', code: '', description: '' }) }} className="px-4 py-2 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E] transition-colors">
          + New Subject
        </button>
      </div>

      {/* Subject Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubjectForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#282F2E] mb-4">{editSubject ? 'Edit Subject' : 'New Subject'}</h2>
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Name</label>
                <input value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Code</label>
                <input value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Description</label>
                <textarea value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSubjectForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E]">{editSubject ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Form Modal */}
      {showChapterForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChapterForm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#282F2E] mb-4">New Chapter</h2>
            <form onSubmit={(e) => handleChapterSubmit(e, showChapterForm)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Title</label>
                <input value={chapterForm.title} onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Description</label>
                <textarea value={chapterForm.description} onChange={e => setChapterForm({ ...chapterForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#282F2E] mb-1">Order</label>
                  <input type="number" value={chapterForm.orderIndex} onChange={e => setChapterForm({ ...chapterForm, orderIndex: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#282F2E] mb-1">Threshold %</label>
                  <input type="number" value={chapterForm.unlockThreshold} onChange={e => setChapterForm({ ...chapterForm, unlockThreshold: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#282F2E] mb-1">Minutes</label>
                  <input type="number" value={chapterForm.estimatedMinutes} onChange={e => setChapterForm({ ...chapterForm, estimatedMinutes: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowChapterForm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E]">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50" onClick={() => { if (expandedSubject === subject.id) setExpandedSubject(null); else { setExpandedSubject(subject.id); loadChapters(subject.id) } }}>
              <div>
                <h3 className="font-bold text-[#282F2E]">{subject.name}</h3>
                <p className="text-sm text-gray-500">{subject.code} &middot; {subject.chapters?.length ?? chapters[subject.id]?.length ?? 0} chapters</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditSubject(subject); setSubjectForm({ name: subject.name, code: subject.code, description: subject.description || '' }); setShowSubjectForm(true) }} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id) }} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSubject === subject.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {expandedSubject === subject.id && (
              <div className="border-t border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#282F2E]">Chapters</h4>
                  <button onClick={() => setShowChapterForm(subject.id)} className="px-3 py-1.5 bg-[#F2B138] text-white text-xs font-bold rounded-lg hover:bg-[#D49A2E]">+ Chapter</button>
                </div>
                {(chapters[subject.id] || []).length === 0 ? (
                  <p className="text-sm text-gray-400">No chapters yet</p>
                ) : (
                  <div className="space-y-2">
                    {(chapters[subject.id] || []).map((ch: any) => (
                      <div key={ch.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-[#282F2E]">{ch.title}</p>
                          <p className="text-xs text-gray-500">Order {ch.orderIndex} &middot; {ch.estimatedMinutes || '?'} min &middot; Threshold: {ch.unlockThreshold}%</p>
                        </div>
                        <button onClick={() => handleDeleteChapter(ch.id, subject.id)} className="text-xs text-red-600">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
