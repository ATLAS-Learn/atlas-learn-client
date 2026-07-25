import { useState, useEffect } from 'react'
import { api } from '../../api/client'

export default function TeacherQuizzes() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>('')
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [quizForm, setQuizForm] = useState({ title: '', description: '', timeLimit: 30 })
  const [showQuestionForm, setShowQuestionForm] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 1 })

  useEffect(() => { loadSubjects() }, [])

  const loadSubjects = async () => {
    try {
      const res = await api.getSubjects({ includeChapters: true })
      setSubjects(Array.isArray(res) ? res : res?.data || [])
    } catch {} finally { setLoading(false) }
  }

  const loadChapters = async (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId)
    setChapters(subject?.chapters || [])
    setSelectedChapter(''); setQuizzes([])
  }

  const loadQuizzes = async (chapterId: string) => {
    try {
      const res = await api.getChapterQuizzes(chapterId)
      setQuizzes(Array.isArray(res) ? res : res?.data || [])
    } catch { setQuizzes([]) }
  }

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChapter) return
    try {
      await api.createQuiz(selectedChapter, quizForm)
      setShowQuizForm(false); setQuizForm({ title: '', description: '', timeLimit: 30 }); loadQuizzes(selectedChapter)
    } catch (err: any) { alert(err.message) }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz?')) return
    try { await api.deleteQuiz(quizId); loadQuizzes(selectedChapter) } catch (err: any) { alert(err.message) }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showQuestionForm) return
    try {
      await api.addQuestion(showQuestionForm, questionForm)
      setShowQuestionForm(null); setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 1 }); loadQuizzes(selectedChapter)
    } catch (err: any) { alert(err.message) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2524] mb-6">Quiz Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
          <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); loadChapters(e.target.value) }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]">
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Chapter</label>
          <select value={selectedChapter} onChange={e => { setSelectedChapter(e.target.value); if (e.target.value) loadQuizzes(e.target.value) }} disabled={!selectedSubject} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138] disabled:opacity-40">
            <option value="">Select chapter</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        {selectedChapter && (
          <div className="flex items-end">
            <button onClick={() => setShowQuizForm(true)} className="px-4 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E] transition-colors whitespace-nowrap">
              + New Quiz
            </button>
          </div>
        )}
      </div>

      {/* Quiz Form Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQuizForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#282F2E] mb-4">New Quiz</h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Title</label>
                <input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Description</label>
                <textarea value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Time Limit (minutes)</label>
                <input type="number" value={quizForm.timeLimit} onChange={e => setQuizForm({ ...quizForm, timeLimit: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowQuizForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E]">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQuestionForm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#282F2E] mb-4">Add Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-1">Question</label>
                <textarea value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} required rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282F2E] mb-2">Options (select the correct one)</label>
                {questionForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input type="radio" name="correctAnswer" checked={questionForm.correctAnswer === i} onChange={() => setQuestionForm({ ...questionForm, correctAnswer: i })} className="accent-[#F2B138]" />
                    <input value={opt} onChange={e => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm({ ...questionForm, options: opts }) }} placeholder={`Option ${i + 1}`} required className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#282F2E] mb-1">Points</label>
                  <input type="number" value={questionForm.points} onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#282F2E] mb-1">Explanation</label>
                  <input value={questionForm.explanation} onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowQuestionForm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E]">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quizzes List */}
      {!selectedChapter && <p className="text-gray-400 text-sm">Select a subject and chapter to manage quizzes</p>}
      {selectedChapter && quizzes.length === 0 && <p className="text-gray-400 text-sm">No quizzes for this chapter. Create one to get started.</p>}
      <div className="space-y-4">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[#282F2E]">{quiz.title}</h3>
                <p className="text-sm text-gray-500">{quiz.description || 'No description'} &middot; {quiz.timeLimit || '?'} min &middot; {quiz.questions?.length ?? quiz._count?.questions ?? 0} questions</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowQuestionForm(quiz.id)} className="px-3 py-1.5 bg-[#F2B138] text-white text-xs font-bold rounded-lg hover:bg-[#D49A2E]">+ Question</button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
            {quiz.questions && quiz.questions.length > 0 && (
              <div className="space-y-2 mt-3">
                {quiz.questions.map((q: any, qi: number) => (
                  <div key={q.id || qi} className="p-3 bg-[#FAFAFA] rounded-xl text-sm">
                    <p className="font-medium text-[#282F2E]">{qi + 1}. {q.question}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      {q.options?.map((o: string, oi: number) => (
                        <span key={oi} className={oi === q.correctAnswer ? 'text-green-600 font-semibold' : ''}>{String.fromCharCode(65 + oi)}. {o}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
