import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../api/client'
import AIQuestionGenerator from '../../components/AIQuestionGenerator'

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  questions?: Question[]
}

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  points?: number
}

interface QuestionForm {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  points: number
}

interface GeneratedQuestion {
  questionText: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  points: number
  questionType: 'MCQ' | 'STRUCTURAL'
  sampleAnswer?: string
}

interface DraftQuestion {
  questionText: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  points: number
  questionType: 'MCQ' | 'STRUCTURAL'
  sampleAnswer?: string
  isDraft: true
}

const emptyQuestionForm: QuestionForm = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
  points: 1,
}

export default function QuizDetail() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const stateQuiz = (location.state as any)?.quiz as Quiz | undefined
  const stateChapterId = (location.state as any)?.chapterId as string | undefined

  const [quiz, setQuiz] = useState<Quiz | null>(stateQuiz || null)
  const [chapterId] = useState<string | undefined>(stateChapterId)
  const [loading, setLoading] = useState(!stateQuiz)

  const [showQuizForm, setShowQuizForm] = useState(false)
  const [quizForm, setQuizForm] = useState({ title: '', description: '', timeLimit: 30 })

  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm)
  const [submitting, setSubmitting] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([])
  const [editingDraftIdx, setEditingDraftIdx] = useState<number | null>(null)
  const [editDraftForm, setEditDraftForm] = useState<DraftQuestion | null>(null)

  useEffect(() => {
    if (!stateQuiz && quizId) {
      loadQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  const loadQuiz = async () => {
    if (!quizId) return
    setLoading(true)
    try {
      if (chapterId) {
        const data = await api.getChapterQuizzes(chapterId)
        const list = Array.isArray(data) ? data : data?.data || []
        const found = list.find((q: any) => q.id === quizId)
        if (found) setQuiz(found)
        else setQuiz(null)
      } else {
        setQuiz(null)
      }
    } catch {
      setQuiz(null)
    } finally {
      setLoading(false)
    }
  }

  const reloadQuiz = async () => {
    if (!quizId) return
    try {
      if (chapterId) {
        const data = await api.getChapterQuizzes(chapterId)
        const list = Array.isArray(data) ? data : data?.data || []
        const found = list.find((q: any) => q.id === quizId)
        if (found) setQuiz(found)
      }
    } catch {}
  }

  const openQuizEditForm = () => {
    if (!quiz) return
    setQuizForm({
      title: quiz.title || '',
      description: quiz.description || '',
      timeLimit: quiz.timeLimit || 30,
    })
    setShowQuizForm(true)
  }

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quizId) return
    setSubmitting(true)
    try {
      await api.updateQuiz(quizId, quizForm)
      setShowQuizForm(false)
      reloadQuiz()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openAddQuestionForm = () => {
    setEditingQuestion(null)
    setQuestionForm({ ...emptyQuestionForm })
    setShowQuestionForm(true)
  }

  const openEditQuestionForm = (q: Question) => {
    setEditingQuestion(q)
    setQuestionForm({
      question: q.question || '',
      options: q.options?.length >= 4 ? [...q.options] : ['', '', '', ''],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || '',
      points: q.points ?? 1,
    })
    setShowQuestionForm(true)
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quizId) return
    setSubmitting(true)
    try {
      if (editingQuestion) {
        await api.updateQuestion(quizId, editingQuestion.id, {
          question: questionForm.question,
          options: questionForm.options,
          correctAnswer: questionForm.correctAnswer,
          explanation: questionForm.explanation || undefined,
          points: questionForm.points,
        })
        setShowQuestionForm(false)
        setEditingQuestion(null)
        reloadQuiz()
      } else {
        handleAddManualQuestion(e)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!quizId || !confirm('Delete this question?')) return
    try {
      await api.deleteQuestion(quizId, questionId)
      reloadQuiz()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!quizId || !confirm('Delete this quiz and all its questions?')) return
    try {
      await api.deleteQuiz(quizId)
      navigate('/teacher/quizzes')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleAIAccept = (questions: GeneratedQuestion[]) => {
    setDraftQuestions(prev => [...prev, ...questions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
      points: q.points,
      questionType: q.questionType,
      sampleAnswer: q.sampleAnswer,
      isDraft: true as const,
    }))])
    setShowAIGenerator(false)
  }

  const handleSaveDrafts = async () => {
    if (!quizId || draftQuestions.length === 0) return
    setSubmitting(true)
    try {
      for (const q of draftQuestions) {
        await api.addQuestion(quizId, {
          question: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswerIndex,
          explanation: q.explanation || undefined,
          points: q.points,
        })
      }
      setDraftQuestions([])
      reloadQuiz()
    } catch (err: any) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDeleteDraft = (idx: number) => {
    if (!confirm('Remove this draft question?')) return
    setDraftQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const startEditDraft = (idx: number) => {
    setEditingDraftIdx(idx)
    setEditDraftForm({ ...draftQuestions[idx] })
  }

  const saveEditDraft = () => {
    if (editingDraftIdx === null || !editDraftForm) return
    setDraftQuestions(prev => {
      const next = [...prev]
      next[editingDraftIdx] = editDraftForm
      return next
    })
    setEditingDraftIdx(null)
    setEditDraftForm(null)
  }

  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    const newDraft: DraftQuestion = {
      questionText: questionForm.question,
      options: questionForm.options.filter(o => o.trim()),
      correctAnswerIndex: questionForm.correctAnswer,
      points: questionForm.points,
      explanation: questionForm.explanation || '',
      questionType: 'MCQ',
      isDraft: true,
    }
    setDraftQuestions(prev => [...prev, newDraft])
    setShowQuestionForm(false)
    setEditingQuestion(null)
    setQuestionForm({ ...emptyQuestionForm })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-3 text-sm text-gray-400'>
          <button onClick={() => navigate('/teacher/quizzes')} className='hover:text-[#084A59] transition-colors font-medium'>&larr; Back to Quizzes</button>
        </div>
        <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
          <p className='text-gray-500 font-semibold text-lg'>Quiz not found</p>
          <p className='text-sm text-gray-400 mt-2'>The quiz could not be loaded. Please go back to the quizzes list.</p>
          <button
            onClick={() => navigate('/teacher/quizzes')}
            className='mt-4 px-5 py-2.5 bg-[#084A59] text-white text-sm font-bold rounded-xl hover:bg-[#011C26] transition-colors'
          >
            Go to Quizzes
          </button>
        </div>
      </div>
    )
  }

  const questions = quiz.questions || []

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3 text-sm text-gray-400 mb-2'>
        <button onClick={() => navigate('/teacher/quizzes')} className='hover:text-[#084A59] transition-colors font-medium'>&larr; Back to Quizzes</button>
      </div>

      {/* Quiz Header */}
      <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <div className='bg-slate-50/80 px-6 py-5 flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <h2 className='text-2xl font-bold text-[#084A59]'>{quiz.title}</h2>
            {quiz.description && (
              <p className='text-sm text-gray-400 mt-1'>{quiz.description}</p>
            )}
            <div className='flex items-center gap-3 mt-3'>
              {quiz.timeLimit && (
                <span className='text-xs font-semibold text-gray-400 bg-white px-2.5 py-1 rounded-lg border border-gray-200'>
                  {quiz.timeLimit} min
                </span>
              )}
              <span className='text-xs font-semibold text-gray-400 bg-white px-2.5 py-1 rounded-lg border border-gray-200'>
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className='flex gap-2 flex-shrink-0 ml-4'>
            <button
              onClick={openQuizEditForm}
              className='px-3.5 py-2 text-xs font-bold text-[#084A59] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'
            >
              Edit Quiz
            </button>
            <button
              onClick={handleDeleteQuiz}
              className='px-3.5 py-2 text-xs font-bold text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors'
            >
              Delete Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div>
        {/* Draft save bar */}
        {draftQuestions.length > 0 && (
          <div className='bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm font-bold text-amber-700'>{draftQuestions.length} draft question{draftQuestions.length !== 1 ? 's' : ''} unsaved</p>
              <p className='text-xs text-amber-500 mt-0.5'>Save to add them to this quiz</p>
            </div>
            <div className='flex gap-2'>
              <button onClick={() => setDraftQuestions([])} className='px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-bold rounded-xl hover:bg-amber-50 transition-colors'>
                Discard
              </button>
              <button onClick={handleSaveDrafts} disabled={submitting} className='px-4 py-2 bg-[#084A59] text-white text-sm font-bold rounded-xl hover:bg-[#011C26] transition-colors disabled:opacity-50'>
                {submitting ? 'Saving...' : 'Save to Quiz'}
              </button>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between mb-3'>
          <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Questions ({questions.length + draftQuestions.length})</span>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowAIGenerator(true)}
              className='px-4 py-2 bg-[#084A59] text-white text-xs font-bold rounded-xl hover:bg-[#011C26] transition-colors flex items-center gap-2'
            >
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' /></svg>
              Generate with AI
            </button>
            <button
              onClick={openAddQuestionForm}
              className='px-4 py-2 bg-[#084A59] text-white text-xs font-bold rounded-xl hover:bg-[#011C26] transition-colors'
            >
              + Add Question
            </button>
          </div>
        </div>

        {(questions.length === 0 && draftQuestions.length === 0) ? (
          <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
            <p className='text-gray-400 font-medium'>No questions yet</p>
            <p className='text-xs text-gray-400 mt-1'>Add questions manually or generate with AI</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {questions.map((q: Question, qi: number) => (
              <div key={q.id} className='bg-white border border-gray-100 rounded-xl overflow-hidden hover:bg-gray-50/30 transition-colors'>
                <div className='px-5 py-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                          {qi + 1}
                        </span>
                        {q.points != null && q.points > 0 && (
                          <span className='text-xs font-semibold text-[#084A59] bg-white px-2 py-0.5 rounded border border-gray-100'>
                            {q.points} pt{q.points !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className='text-sm font-semibold text-[#084A59] mb-2'>{q.question}</p>
                      {q.options && q.options.length > 0 && (
                        <div className='space-y-1 ml-1'>
                          {q.options.map((opt: string, oi: number) => (
                            <div key={oi} className='flex items-center gap-2'>
                              <span className={`text-xs font-semibold ${oi === q.correctAnswer ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              <span className={`text-xs ${oi === q.correctAnswer ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>
                                {opt}
                              </span>
                              {oi === q.correctAnswer && (
                                <svg className='w-3.5 h-3.5 text-slate-500 flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                                  <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <p className='text-xs text-gray-400 mt-2 ml-1 italic'>Explanation: {q.explanation}</p>
                      )}
                    </div>
                    <div className='flex gap-1 flex-shrink-0'>
                      <button
                        onClick={() => openEditQuestionForm(q)}
                        className='p-2 rounded-lg text-gray-400 hover:text-[#084A59] hover:bg-slate-50 transition-colors'
                      >
                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className='p-2 rounded-lg text-gray-400 hover:text-slate-400 hover:bg-slate-50 transition-colors'
                      >
                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Draft questions */}
            {draftQuestions.map((q, idx) => (
              <div key={`draft-${idx}`} className='bg-white border-2 border-dashed border-amber-300 rounded-xl overflow-hidden relative'>
                <div className='absolute -top-2.5 left-4 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200'>
                  DRAFT
                </div>
                <div className='px-5 py-4 mt-1'>
                  {editingDraftIdx === idx && editDraftForm ? (
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${editDraftForm.questionType === 'MCQ' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {editDraftForm.questionType}
                        </span>
                        <span className='text-xs font-bold text-amber-500'>Editing Draft</span>
                      </div>
                      <textarea
                        value={editDraftForm.questionText}
                        onChange={e => setEditDraftForm({ ...editDraftForm, questionText: e.target.value })}
                        rows={2}
                        className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 resize-none'
                      />
                      {editDraftForm.questionType === 'MCQ' && (
                        <div className='space-y-2'>
                          {editDraftForm.options.map((opt, oi) => (
                            <div key={oi} className='flex items-center gap-2'>
                              <input
                                type='radio'
                                name={`edit-draft-${idx}`}
                                checked={editDraftForm.correctAnswerIndex === oi}
                                onChange={() => setEditDraftForm({ ...editDraftForm, correctAnswerIndex: oi })}
                                className='accent-green-600'
                              />
                              <input
                                value={opt}
                                onChange={e => {
                                  const newOpts = [...editDraftForm.options]
                                  newOpts[oi] = e.target.value
                                  setEditDraftForm({ ...editDraftForm, options: newOpts })
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                className='flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#084A59]/20'
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='text-xs font-semibold text-gray-500'>Points</label>
                          <input
                            type='number'
                            value={editDraftForm.points}
                            onChange={e => setEditDraftForm({ ...editDraftForm, points: Number(e.target.value) })}
                            min={1}
                            className='w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#084A59]/20'
                          />
                        </div>
                        <div>
                          <label className='text-xs font-semibold text-gray-500'>Explanation</label>
                          <input
                            value={editDraftForm.explanation}
                            onChange={e => setEditDraftForm({ ...editDraftForm, explanation: e.target.value })}
                            className='w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#084A59]/20'
                          />
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <button onClick={saveEditDraft} className='px-4 py-1.5 bg-[#084A59] text-white text-xs font-semibold rounded-lg'>Save</button>
                        <button onClick={() => { setEditingDraftIdx(null); setEditDraftForm(null) }} className='px-4 py-1.5 text-xs text-gray-500 font-semibold'>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2'>
                          <span className='w-7 h-7 rounded-lg bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                            {questions.length + idx + 1}
                          </span>
                          <span className='text-xs font-bold text-amber-500'>Draft</span>
                          {q.points > 0 && (
                            <span className='text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'>
                              {q.points} pt{q.points !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className='text-sm font-semibold text-[#084A59] mb-2'>{q.questionText}</p>
                        {q.questionType === 'MCQ' && q.options && q.options.length > 0 && (
                          <div className='space-y-1 ml-1'>
                            {q.options.map((opt: string, oi: number) => (
                              <div key={oi} className='flex items-center gap-2'>
                                <span className={`text-xs font-semibold ${oi === q.correctAnswerIndex ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                <span className={`text-xs ${oi === q.correctAnswerIndex ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>
                                  {opt}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.questionType === 'STRUCTURAL' && (
                          <p className='text-xs text-purple-500 mt-1 italic'>Structural question — requires manual grading</p>
                        )}
                        {q.explanation && (
                          <p className='text-xs text-gray-400 mt-2 ml-1 italic'>Explanation: {q.explanation}</p>
                        )}
                      </div>
                      <div className='flex gap-1 flex-shrink-0'>
                        <button
                          onClick={() => startEditDraft(idx)}
                          className='p-2 rounded-lg text-amber-500 hover:text-[#084A59] hover:bg-slate-50 transition-colors'
                        >
                          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(idx)}
                          className='p-2 rounded-lg text-amber-500 hover:text-red-500 hover:bg-slate-50 transition-colors'
                        >
                          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Edit Modal */}
      {showQuizForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setShowQuizForm(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>Edit Quiz</h3>
              <button onClick={() => setShowQuizForm(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <form onSubmit={handleQuizSubmit} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Title</label>
                <input
                  value={quizForm.title}
                  onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                  required
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Description</label>
                <textarea
                  value={quizForm.description}
                  onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows={2}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all resize-none'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Time Limit (minutes)</label>
                <input
                  type='number'
                  value={quizForm.timeLimit}
                  onChange={e => setQuizForm({ ...quizForm, timeLimit: Number(e.target.value) })}
                  min={1}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                />
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowQuizForm(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>Cancel</button>
                <button type='submit' disabled={submitting} className='flex-1 py-2.5 bg-[#084A59] text-white font-semibold rounded-xl hover:bg-[#011C26] transition-colors text-sm disabled:opacity-50'>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => { setShowQuestionForm(false); setEditingQuestion(null) }}>
          <div className='bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10'>
              <h3 className='text-lg font-bold text-[#084A59]'>{editingQuestion ? 'Edit Question' : 'Add Question'}</h3>
              <button onClick={() => { setShowQuestionForm(false); setEditingQuestion(null) }} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <form onSubmit={handleQuestionSubmit} className='px-6 py-5 space-y-5'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Question *</label>
                <textarea
                  value={questionForm.question}
                  onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                  required
                  rows={3}
                  placeholder='Enter the question text...'
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all resize-none'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Options & Correct Answer</label>
                <div className='space-y-3'>
                  {questionForm.options.map((opt, oi) => (
                    <div key={oi} className='flex items-center gap-3'>
                      <input
                        type='radio'
                        name='correctAnswer'
                        checked={questionForm.correctAnswer === oi}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswer: oi })}
                        className='w-4 h-4 accent-[#F2B138] flex-shrink-0 cursor-pointer'
                      />
                      <span className='text-xs font-bold text-gray-400 w-5 flex-shrink-0'>{String.fromCharCode(65 + oi)}.</span>
                      <input
                        value={opt}
                        onChange={e => {
                          const newOpts = [...questionForm.options]
                          newOpts[oi] = e.target.value
                          setQuestionForm({ ...questionForm, options: newOpts })
                        }}
                        required
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className='flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                      />
                      {questionForm.correctAnswer === oi && (
                        <span className='text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0'>Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Points</label>
                  <input
                    type='number'
                    value={questionForm.points}
                    onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    min={1}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Explanation</label>
                  <input
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    placeholder='Optional explanation...'
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                  />
                </div>
              </div>

              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => { setShowQuestionForm(false); setEditingQuestion(null) }} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>Cancel</button>
                <button type='submit' disabled={submitting} className='flex-1 py-2.5 bg-[#084A59] text-white font-semibold rounded-xl hover:bg-[#011C26] transition-colors text-sm disabled:opacity-50'>
                  {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator */}
      {showAIGenerator && chapterId && (
        <AIQuestionGenerator
          mode='quiz'
          chapterId={chapterId}
          onAccept={handleAIAccept}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  )
}
