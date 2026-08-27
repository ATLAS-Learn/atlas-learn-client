import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import AIQuestionGenerator from '../../components/AIQuestionGenerator'

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

export default function ExamDetail() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'questions' | 'attempts' | 'corrections'>('questions')
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    points: 1,
    explanation: '',
    questionType: 'MCQ' as 'MCQ' | 'STRUCTURAL',
    sampleAnswer: '',
  })
  const [saving, setSaving] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([])
  const [corrections, setCorrections] = useState<any[]>([])
  const [correctionsLoading, setCorrectionsLoading] = useState(false)
  const [correctingAttempt, setCorrectingAttempt] = useState<any>(null)
  const [correctionGrades, setCorrectionGrades] = useState<Record<string, { points: number; comment: string }>>({})
  const [correctionSaving, setCorrectionSaving] = useState(false)
  const [editingDraftIdx, setEditingDraftIdx] = useState<number | null>(null)
  const [editDraftForm, setEditDraftForm] = useState<DraftQuestion | null>(null)

  useEffect(() => { if (examId) loadExam() }, [examId])

  const loadExam = async () => {
    if (!examId) return
    try {
      const data = await api.getExam(examId)
      setExam(data)
    } catch {} finally { setLoading(false) }
  }

  const loadAttempts = async () => {
    if (!examId) return
    try {
      const res = await api.getExamAttempts(examId)
      setAttempts(res?.data || [])
      setStats(res?.stats || null)
    } catch {}
  }

  useEffect(() => {
    if (tab === 'attempts' && examId) loadAttempts()
    if (tab === 'corrections' && examId) loadCorrections()
  }, [tab, examId])

  const loadCorrections = async () => {
    if (!examId) return
    setCorrectionsLoading(true)
    try {
      const data = await api.getPendingCorrections(examId)
      setCorrections(data || [])
    } catch {} finally { setCorrectionsLoading(false) }
  }

  // AI questions go into draft queue — no API call yet
  const handleAIAccept = (questions: DraftQuestion[]) => {
    setDraftQuestions(prev => [...prev, ...questions.map(q => ({ ...q, isDraft: true as const }))])
    setShowAIGenerator(false)
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

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    const newDraft: DraftQuestion = {
      questionText: questionForm.questionText,
      options: questionForm.questionType === 'MCQ' ? questionForm.options.filter(o => o.trim()) : [],
      correctAnswerIndex: questionForm.questionType === 'MCQ' ? questionForm.correctAnswerIndex : 0,
      points: questionForm.points,
      explanation: questionForm.explanation || '',
      questionType: questionForm.questionType,
      sampleAnswer: questionForm.questionType === 'STRUCTURAL' ? questionForm.sampleAnswer : undefined,
      isDraft: true,
    }
    setDraftQuestions(prev => [...prev, newDraft])
    setShowAddQuestion(false)
    setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, points: 1, explanation: '', questionType: 'MCQ', sampleAnswer: '' })
  }

  const handleDeleteQuestion = async (questionIndex: number) => {
    if (!examId || !confirm('Delete this question?')) return
    try {
      const existingQuestions = exam.questions || []
      const updated = existingQuestions.filter((_: any, i: number) => i !== questionIndex)
      await api.updateExam(examId, {
        questions: updated.map((q: any) => ({
          questionText: q.questionText,
          explanation: q.explanation,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          points: q.points,
        })),
      })
      loadExam()
    } catch (err: any) { alert(err.message) }
  }

  const handleSaveQuestions = async (publish: boolean) => {
    if (!examId) return
    setSaving(true)
    try {
      const existingQuestions = (exam.questions || []).map((q: any) => ({
        questionText: q.questionText,
        explanation: q.explanation,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        points: q.points,
        questionType: q.questionType || 'MCQ',
      }))
      const newDrafts = draftQuestions.map(q => ({
        questionText: q.questionText,
        explanation: q.explanation,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        points: q.points,
        questionType: q.questionType,
      }))
      await api.updateExam(examId, {
        questions: [...existingQuestions, ...newDrafts],
      })
      if (publish && !exam.isPublished) {
        await api.togglePublishExam(examId)
      }
      setDraftQuestions([])
      loadExam()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleTogglePublish = async () => {
    if (!examId) return
    try {
      await api.togglePublishExam(examId)
      loadExam()
    } catch (err: any) { alert(err.message) }
  }

  const handleDelete = async () => {
    if (!examId || !confirm('Delete this exam and all its attempts?')) return
    try {
      await api.deleteExam(examId)
      navigate('/teacher/exams')
    } catch (err: any) { alert(err.message) }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options]
    newOptions[index] = value
    setQuestionForm({ ...questionForm, options: newOptions })
  }

  const handleGradeQuestion = (questionId: string, field: 'points' | 'comment', value: number | string) => {
    setCorrectionGrades(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value, points: prev[questionId]?.points ?? 0, comment: prev[questionId]?.comment ?? '' },
    }))
  }

  const handleSubmitCorrection = async (attemptId: string) => {
    if (!examId) return
    setCorrectionSaving(true)
    try {
      const correctionsPayload = Object.entries(correctionGrades).map(([questionId, g]) => ({
        questionId,
        points: g.points,
        comment: g.comment || undefined,
      }))
      await api.correctExamAttempt(examId, { attemptId, corrections: correctionsPayload })
      setCorrectingAttempt(null)
      setCorrectionGrades({})
      loadCorrections()
    } catch (err: any) { alert(err.message) }
    finally { setCorrectionSaving(false) }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='text-center py-16'>
        <p className='text-gray-500 font-semibold'>Exam not found</p>
        <button onClick={() => navigate('/teacher/exams')} className='mt-4 text-sm text-[#084A59] font-semibold'>Back to Exams</button>
      </div>
    )
  }

  const totalQuestions = (exam.questions?.length ?? 0) + draftQuestions.length

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <button onClick={() => navigate('/teacher/exams')} className='text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1'>
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' /></svg>
            Back to Exams
          </button>
          <h2 className='text-2xl font-bold text-[#084A59]'>{exam.title}</h2>
          <p className='text-sm text-gray-400 mt-1'>
            {exam.subject?.name} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · {exam.timeLimit ? `${Math.round(exam.timeLimit / 60)} min` : 'No time limit'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {exam.isPublished ? 'Published' : 'Draft'}
          </span>
          <button onClick={handleTogglePublish} className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${exam.isPublished ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
            {exam.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={handleDelete} className='px-4 py-2 text-sm font-semibold text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'>
            Delete
          </button>
        </div>
      </div>

      {/* Draft save bar */}
      {draftQuestions.length > 0 && (
        <div className='bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between'>
          <div>
            <p className='text-sm font-bold text-amber-700'>{draftQuestions.length} draft question{draftQuestions.length !== 1 ? 's' : ''} unsaved</p>
            <p className='text-xs text-amber-500 mt-0.5'>Save your draft or publish to make them visible to students</p>
          </div>
          <div className='flex gap-2'>
            <button onClick={() => handleSaveQuestions(false)} disabled={saving} className='px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-bold rounded-xl hover:bg-amber-50 transition-colors disabled:opacity-50'>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button onClick={() => handleSaveQuestions(true)} disabled={saving} className='px-4 py-2 bg-[#084A59] text-white text-sm font-bold rounded-xl hover:bg-[#011C26] transition-colors disabled:opacity-50'>
              {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className='flex gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit'>
        {(['questions', 'attempts', 'corrections'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${tab === t ? 'bg-[#084A59] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {t} {t === 'questions' ? `(${totalQuestions})` : t === 'attempts' ? `(${stats?.totalAttempts ?? 0})` : `(${corrections.length})`}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className='space-y-3'>
          <div className='flex justify-end gap-2'>
            <button onClick={() => setShowAIGenerator(true)} className='px-4 py-2 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#011C26] transition-colors flex items-center gap-2'>
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' /></svg>
              Generate with AI
            </button>
            <button onClick={() => setShowAddQuestion(true)} className='px-4 py-2 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#011C26] transition-colors'>
              + Add Question
            </button>
          </div>

          {/* Saved questions */}
          {(exam.questions ?? []).map((q: any, idx: number) => (
            <div key={q.id || idx} className='bg-white rounded-2xl border border-gray-200 p-5'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-xs font-bold text-gray-400 mb-1'>Q{idx + 1} · {q.points} pt{q.points !== 1 ? 's' : ''}</p>
                  <p className='text-sm font-semibold text-[#084A59]'>{q.questionText}</p>
                  {q.questionType === 'MCQ' || !q.questionType ? (
                    <div className='mt-2 space-y-1'>
                      {q.options?.map((opt: string, oi: number) => (
                        <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${oi === q.correctAnswerIndex ? 'bg-green-50 text-green-700 font-semibold' : 'bg-slate-50 text-gray-500'}`}>
                          {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswerIndex ? '✓' : ''}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-xs text-purple-500 mt-1 italic'>Structural question — requires manual grading</p>
                  )}
                  {q.explanation && (
                    <p className='text-xs text-gray-400 mt-2 italic'>Explanation: {q.explanation}</p>
                  )}
                </div>
                <button onClick={() => handleDeleteQuestion(idx)} className='p-2 text-slate-400 hover:text-red-500 transition-colors'>
                  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg>
                </button>
              </div>
            </div>
          ))}

          {/* Draft questions */}
          {draftQuestions.map((q, idx) => (
            <div key={`draft-${idx}`} className='bg-white rounded-2xl border-2 border-dashed border-amber-300 p-5 relative'>
              <div className='absolute -top-2.5 left-4 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200'>
                DRAFT
              </div>
              {editingDraftIdx === idx && editDraftForm ? (
                <div className='space-y-3 mt-1'>
                  <div className='flex items-center gap-2'>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${editDraftForm.questionType === 'MCQ' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {editDraftForm.questionType}
                    </span>
                    <span className='text-[10px] font-bold text-gray-400'>Editing Draft Q{idx + 1}</span>
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
                <div className='flex items-start justify-between mt-1'>
                  <div className='flex-1'>
                    <p className='text-xs font-bold text-amber-500 mb-1'>Draft Q{(exam.questions?.length ?? 0) + idx + 1} · {q.points} pt{q.points !== 1 ? 's' : ''}</p>
                    <p className='text-sm font-semibold text-[#084A59]'>{q.questionText}</p>
                    {q.questionType === 'MCQ' ? (
                      <div className='mt-2 space-y-1'>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${oi === q.correctAnswerIndex ? 'bg-green-50 text-green-700 font-semibold' : 'bg-slate-50 text-gray-500'}`}>
                            {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswerIndex ? '✓' : ''}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-xs text-purple-500 mt-1 italic'>Structural question — requires manual grading</p>
                    )}
                    {q.explanation && (
                      <p className='text-xs text-gray-400 mt-2 italic'>Explanation: {q.explanation}</p>
                    )}
                  </div>
                  <div className='flex gap-1 shrink-0'>
                    <button onClick={() => startEditDraft(idx)} className='p-2 text-amber-500 hover:text-[#084A59] transition-colors'>
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' /></svg>
                    </button>
                    <button onClick={() => handleDeleteDraft(idx)} className='p-2 text-amber-500 hover:text-red-500 transition-colors'>
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {totalQuestions === 0 && (
            <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
              <p className='text-gray-500 font-semibold'>No questions yet</p>
              <p className='text-gray-400 text-sm mt-1'>Add questions manually or generate with AI</p>
            </div>
          )}
        </div>
      )}

      {/* Attempts Tab */}
      {tab === 'attempts' && (
        <div className='space-y-4'>
          {stats && (
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-white rounded-2xl border border-gray-200 p-5'>
                <p className='text-sm text-gray-400 font-semibold'>Total Attempts</p>
                <p className='text-2xl font-bold text-[#084A59] mt-1'>{stats.totalAttempts}</p>
              </div>
              <div className='bg-white rounded-2xl border border-gray-200 p-5'>
                <p className='text-sm text-gray-400 font-semibold'>Average Score</p>
                <p className='text-2xl font-bold text-[#084A59] mt-1'>{stats.avgScore}%</p>
              </div>
            </div>
          )}

          {attempts.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
              <p className='text-gray-500 font-semibold'>No attempts yet</p>
            </div>
          ) : (
            <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-100 bg-slate-50/80'>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Student</th>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Score</th>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Time</th>
                    <th className='text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase'>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a.id} className='border-b border-gray-50 hover:bg-slate-50/50 transition-colors'>
                      <td className='px-5 py-3'>
                        <p className='text-sm font-semibold text-[#084A59]'>{a.user?.name || 'Unknown'}</p>
                        <p className='text-xs text-gray-400'>{a.user?.email}</p>
                      </td>
                      <td className='px-5 py-3'>
                        <span className={`text-sm font-bold ${a.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                          {a.score}%
                        </span>
                      </td>
                      <td className='px-5 py-3 text-sm text-gray-500'>
                        {a.timeSpent ? `${Math.round(a.timeSpent / 60)}m ${a.timeSpent % 60}s` : '-'}
                      </td>
                      <td className='px-5 py-3 text-sm text-gray-500'>
                        {new Date(a.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Corrections Tab */}
      {tab === 'corrections' && (
        <div className='space-y-4'>
          {correctionsLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
            </div>
          ) : corrections.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
              <p className='text-gray-500 font-semibold'>No pending corrections</p>
              <p className='text-gray-400 text-sm mt-1'>Student submissions with structural questions will appear here</p>
            </div>
          ) : (
            corrections.map((attempt: any) => (
              <div key={attempt.id} className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                <div className='px-5 py-4 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-bold text-[#084A59]'>{attempt.user?.name || 'Unknown Student'}</p>
                    <p className='text-xs text-gray-400'>{attempt.user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCorrectingAttempt(correctingAttempt?.id === attempt.id ? null : attempt)
                      if (attempt.id !== correctingAttempt?.id) {
                        const grades: Record<string, { points: number; comment: string }> = {}
                        attempt.answers?.forEach((a: any) => {
                          if (a.questionType === 'STRUCTURAL' || a.isCorrected === false) {
                            grades[a.questionId] = { points: 0, comment: '' }
                          }
                        })
                        setCorrectionGrades(grades)
                      }
                    }}
                    className='px-4 py-2 bg-[#F2B138] text-white text-xs font-bold rounded-xl hover:bg-[#011C26] transition-colors'
                  >
                    {correctingAttempt?.id === attempt.id ? 'Cancel' : 'Grade'}
                  </button>
                </div>

                {correctingAttempt?.id === attempt.id && (
                  <div className='px-5 py-4 space-y-4'>
                    <p className='text-xs font-bold text-gray-400 uppercase'>Structural Answers</p>
                    {attempt.answers?.filter((a: any) => a.questionType === 'STRUCTURAL' || a.isCorrected === false).map((a: any) => (
                      <div key={a.questionId} className='border border-gray-200 rounded-xl p-4 space-y-3'>
                        <p className='text-sm font-semibold text-[#084A59]'>{a.questionText || 'Question'}</p>
                        <div className='bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 whitespace-pre-wrap'>{a.answer || '(No answer provided)'}</div>
                        {a.sampleAnswer && <p className='text-xs text-gray-400 italic'>Sample: {a.sampleAnswer}</p>}
                        <div className='grid grid-cols-2 gap-3'>
                          <div>
                            <label className='text-xs font-semibold text-gray-500'>Points</label>
                            <input
                              type='number'
                              value={correctionGrades[a.questionId]?.points ?? 0}
                              onChange={e => handleGradeQuestion(a.questionId, 'points', Number(e.target.value))}
                              min={0}
                              max={a.maxPoints || 10}
                              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20'
                            />
                          </div>
                          <div>
                            <label className='text-xs font-semibold text-gray-500'>Comment</label>
                            <input
                              value={correctionGrades[a.questionId]?.comment ?? ''}
                              onChange={e => handleGradeQuestion(a.questionId, 'comment', e.target.value)}
                              placeholder='Feedback...'
                              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleSubmitCorrection(attempt.id)}
                      disabled={correctionSaving}
                      className='px-6 py-2.5 bg-[#084A59] text-white text-sm font-bold rounded-xl hover:bg-[#011C26] transition-colors disabled:opacity-50'
                    >
                      {correctionSaving ? 'Saving...' : 'Submit Corrections'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={() => setShowAddQuestion(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='text-lg font-bold text-[#084A59]'>Add Question</h3>
              <button onClick={() => setShowAddQuestion(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <form onSubmit={handleAddQuestion} className='px-6 py-5 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Question Type</label>
                <div className='flex gap-2'>
                  {(['MCQ', 'STRUCTURAL'] as const).map(t => (
                    <button
                      key={t}
                      type='button'
                      onClick={() => setQuestionForm({ ...questionForm, questionType: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${questionForm.questionType === t ? (t === 'MCQ' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200') : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                    >
                      {t === 'MCQ' ? 'Multiple Choice' : 'Structural'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Question</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  required
                  rows={2}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] resize-none'
                />
              </div>
              {questionForm.questionType === 'MCQ' ? (
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Options</label>
                <div className='space-y-2'>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <input
                        type='radio'
                        name='correct'
                        checked={questionForm.correctAnswerIndex === i}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswerIndex: i })}
                        className='accent-green-600'
                      />
                      <input
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        required
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className='flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
                      />
                    </div>
                  ))}
                </div>
                <p className='text-[11px] text-gray-400 mt-1'>Select the correct answer</p>
              </div>
              ) : (
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Sample Answer (optional)</label>
                <textarea
                  value={questionForm.sampleAnswer}
                  onChange={e => setQuestionForm({ ...questionForm, sampleAnswer: e.target.value })}
                  rows={3}
                  placeholder='Provide a model answer for reference...'
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] resize-none'
                />
                <p className='text-[11px] text-gray-400 mt-1'>This will be used as a reference when grading</p>
              </div>
              )}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Points</label>
                  <input
                    type='number'
                    value={questionForm.points}
                    onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    min={1}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Explanation</label>
                  <input
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
                  />
                </div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowAddQuestion(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
                <button type='submit' className='flex-1 py-2.5 bg-[#084A59] text-white font-semibold rounded-xl hover:bg-[#011C26] text-sm'>
                  Add to Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator */}
      {showAIGenerator && (
        <AIQuestionGenerator
          mode='exam'
          subjectId={exam.subjectId}
          initialChapterIds={exam.questions?.length ? [...new Set(exam.questions.map((q: any) => q.chapterId).filter(Boolean))] : undefined}
          onAccept={handleAIAccept}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  )
}
