import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Record<string, any[]>>({})
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [chapterForm, setChapterForm] = useState({ title: '', orderIndex: 1, description: '', unlockThreshold: 70, estimatedMinutes: 15, subjectId: '' })
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)

  const loadSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getSubjects()
      setSubjects(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSubjects() }, [loadSubjects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await api.updateSubject(editingId, form)
    } else {
      await api.createSubject(form)
    }
    setForm({ name: '', code: '', description: '' })
    setEditingId(null)
    setShowForm(false)
    loadSubjects()
  }

  const handleEdit = (s: any) => {
    setForm({ name: s.name, code: s.code, description: s.description || '' })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject and all its chapters/lessons?')) return
    await api.deleteSubject(id)
    loadSubjects()
  }

  const toggleExpand = async (subjectId: string) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null)
      return
    }
    setExpandedSubject(subjectId)
    if (!chapters[subjectId]) {
      try {
        const data = await api.getChapters({ subjectId })
        setChapters((prev) => ({ ...prev, [subjectId]: Array.isArray(data) ? data : [] }))
      } catch {}
    }
  }

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingChapterId) {
      await api.updateChapter(editingChapterId, chapterForm)
    } else {
      await api.createChapter(chapterForm)
    }
    setChapterForm({ title: '', orderIndex: 1, description: '', unlockThreshold: 70, estimatedMinutes: 15, subjectId: '' })
    setEditingChapterId(null)
    setShowChapterForm(false)
    if (expandedSubject) {
      const data = await api.getChapters({ subjectId: expandedSubject })
      setChapters((prev) => ({ ...prev, [expandedSubject]: Array.isArray(data) ? data : [] }))
    }
    loadSubjects()
  }

  const handleEditChapter = (ch: any) => {
    setChapterForm({ title: ch.title, orderIndex: ch.orderIndex, description: ch.description || '', unlockThreshold: ch.unlockThreshold || 70, estimatedMinutes: ch.estimatedMinutes || 15, subjectId: ch.subjectId })
    setEditingChapterId(ch.id)
    setShowChapterForm(true)
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Delete this chapter?')) return
    await api.deleteChapter(chapterId)
    if (expandedSubject) {
      const data = await api.getChapters({ subjectId: expandedSubject })
      setChapters((prev) => ({ ...prev, [expandedSubject]: Array.isArray(data) ? data : [] }))
    }
    loadSubjects()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{subjects.length} subjects</p>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', description: '' }) }}
          className="px-4 py-2.5 bg-[#F2B138] text-white font-bold text-sm rounded-xl hover:bg-[#D49A2E] transition-colors"
        >
          + New Subject
        </button>
      </div>

      {/* Subject Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#282F2E] mb-4">{editingId ? 'Edit Subject' : 'New Subject'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#D49A2E] transition-colors text-sm">
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Form Modal */}
      {showChapterForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowChapterForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#282F2E] mb-4">{editingChapterId ? 'Edit Chapter' : 'New Chapter'}</h3>
            <form onSubmit={handleChapterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Title</label>
                <input value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Order Index</label>
                  <input type="number" value={chapterForm.orderIndex} onChange={(e) => setChapterForm({ ...chapterForm, orderIndex: Number(e.target.value) })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Est. Minutes</label>
                  <input type="number" value={chapterForm.estimatedMinutes} onChange={(e) => setChapterForm({ ...chapterForm, estimatedMinutes: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#D49A2E] transition-colors text-sm">
                  {editingChapterId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowChapterForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No subjects yet</div>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => toggleExpand(s.id)}>
                <div>
                  <div className="font-bold text-[#282F2E]">{s.name}</div>
                  <div className="text-xs text-gray-400 font-semibold">{s.code}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(s) }} className="text-xs font-semibold text-[#F2B138] hover:text-[#D49A2E]">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSubject === s.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedSubject === s.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-[#282F2E]">Chapters</h4>
                    <button
                      onClick={() => { setShowChapterForm(true); setEditingChapterId(null); setChapterForm({ title: '', orderIndex: (chapters[s.id]?.length || 0) + 1, description: '', unlockThreshold: 70, estimatedMinutes: 15, subjectId: s.id }) }}
                      className="px-3 py-1.5 bg-[#F2B138] text-white text-xs font-bold rounded-lg hover:bg-[#D49A2E]"
                    >
                      + Chapter
                    </button>
                  </div>
                  {chapters[s.id]?.length === 0 ? (
                    <p className="text-xs text-gray-400">No chapters yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(chapters[s.id] ?? []).sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((ch: any) => (
                        <div key={ch.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl border border-gray-100">
                          <div>
                            <span className="text-xs font-bold text-[#F2B138] mr-2">#{ch.orderIndex}</span>
                            <span className="text-sm font-semibold text-[#282F2E]">{ch.title}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditChapter(ch)} className="text-xs font-semibold text-[#F2B138]">Edit</button>
                            <button onClick={() => handleDeleteChapter(ch.id)} className="text-xs font-semibold text-red-500">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
