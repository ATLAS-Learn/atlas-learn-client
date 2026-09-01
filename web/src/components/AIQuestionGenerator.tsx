import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface GeneratedQuestion {
  questionText: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  points: number
  questionType: 'MCQ' | 'STRUCTURAL'
  sampleAnswer?: string
}

interface Chapter {
  id: string
  title: string
  orderIndex?: number
}

interface AIQuestionGeneratorProps {
  mode: 'exam' | 'quiz'
  subjectId?: string
  chapterId?: string
  initialChapterIds?: string[]
  onAccept: (questions: GeneratedQuestion[]) => void
  onClose: () => void
}

export default function AIQuestionGenerator({
  mode,
  subjectId,
  chapterId,
  initialChapterIds,
  onAccept,
  onClose,
}: AIQuestionGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(10)
  const [questionType, setQuestionType] = useState<'MCQ' | 'STRUCTURAL' | 'MIXED'>('MCQ')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<GeneratedQuestion | null>(null)

  // Chapter picker state
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set(initialChapterIds || []))
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [allChaptersSelected, setAllChaptersSelected] = useState(true)

  useEffect(() => {
    if (subjectId && mode === 'exam') {
      loadChapters()
    }
  }, [subjectId, mode])

  useEffect(() => {
    if (chapters.length > 0 && selectedChapterIds.size === chapters.length) {
      setAllChaptersSelected(true)
    } else {
      setAllChaptersSelected(false)
    }
  }, [selectedChapterIds, chapters])

  const loadChapters = async () => {
    if (!subjectId) return
    setChaptersLoading(true)
    try {
      const data = await api.getChaptersBySubject(subjectId)
      const list = Array.isArray(data) ? data : data?.data || []
      setChapters(list.sort((a: Chapter, b: Chapter) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)))
      if (!initialChapterIds?.length) {
        setSelectedChapterIds(new Set(list.map((c: Chapter) => c.id)))
      }
    } catch {} finally { setChaptersLoading(false) }
  }

  const toggleChapter = (id: string) => {
    const next = new Set(selectedChapterIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedChapterIds(next)
  }

  const toggleAllChapters = () => {
    if (allChaptersSelected) {
      setSelectedChapterIds(new Set())
    } else {
      setSelectedChapterIds(new Set(chapters.map(c => c.id)))
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const scopedChapterIds = mode === 'exam'
        ? (selectedChapterIds.size > 0 ? [...selectedChapterIds] : undefined)
        : undefined

      let questions: GeneratedQuestion[]
      if (mode === 'exam') {
        questions = await api.generateExamQuestions({
          prompt: prompt || undefined,
          subjectId: subjectId!,
          chapterIds: scopedChapterIds,
          count,
          questionType,
        })
      } else {
        questions = await api.generateQuizQuestions({
          prompt: prompt || undefined,
          chapterId: chapterId!,
          count,
          questionType,
        })
      }
      setGenerated(questions)
      setSelected(new Set(questions.map((_, i) => i)))
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions')
    } finally {
      setGenerating(false)
    }
  }

  const toggleSelect = (idx: number) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === generated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(generated.map((_, i) => i)))
    }
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditForm({ ...generated[idx] })
  }

  const saveEdit = () => {
    if (editingIdx === null || !editForm) return
    const next = [...generated]
    next[editingIdx] = editForm
    setGenerated(next)
    setEditingIdx(null)
    setEditForm(null)
  }

  const deleteQuestion = (idx: number) => {
    setGenerated(generated.filter((_, i) => i !== idx))
    const next = new Set(selected)
    next.delete(idx)
    const reindexed = new Set<number>()
    next.forEach(i => {
      if (i < idx) reindexed.add(i)
      else if (i > idx) reindexed.add(i - 1)
    })
    setSelected(reindexed)
  }

  const handleAccept = () => {
    const accepted = generated.filter((_, i) => selected.has(i))
    onAccept(accepted)
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={onClose}>
      <div className='bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col' onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0'>
          <div>
            <h3 className='text-lg font-bold text-[#084A59]'>Generate with AI</h3>
            <p className='text-xs text-gray-400 mt-0.5'>Select chapters, configure, review and add to exam</p>
          </div>
          <button onClick={onClose} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400'>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {/* Config (shown before generation) */}
          {generated.length === 0 && (
            <div className='px-6 py-6 space-y-5'>
              {/* Chapter Picker (exam mode only) */}
              {mode === 'exam' && subjectId && (
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Chapters to include
                  </label>
                  {chaptersLoading ? (
                    <div className='flex items-center gap-2 py-4 text-sm text-gray-400'>
                      <div className='w-4 h-4 border-2 border-[#084A59] border-t-transparent rounded-full animate-spin' />
                      Loading chapters...
                    </div>
                  ) : chapters.length === 0 ? (
                    <p className='text-sm text-gray-400 py-2'>No chapters found for this subject</p>
                  ) : (
                    <div className='border border-gray-200 rounded-xl overflow-hidden'>
                      <div className='px-4 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={allChaptersSelected}
                            onChange={toggleAllChapters}
                            className='w-4 h-4 accent-[#084A59] rounded cursor-pointer'
                          />
                          <span className='text-xs font-semibold text-gray-500'>
                            {allChaptersSelected ? 'All chapters selected' : `${selectedChapterIds.size} of ${chapters.length} selected`}
                          </span>
                        </div>
                      </div>
                      <div className='max-h-48 overflow-y-auto divide-y divide-gray-50'>
                        {chapters.map(ch => (
                          <label key={ch.id} className='flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 cursor-pointer transition-colors'>
                            <input
                              type='checkbox'
                              checked={selectedChapterIds.has(ch.id)}
                              onChange={() => toggleChapter(ch.id)}
                              className='w-4 h-4 accent-[#084A59] rounded cursor-pointer'
                            />
                            <span className='text-sm text-gray-700'>{ch.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                  Additional instructions (optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                  placeholder='e.g. Focus on data structures, include real-world examples, mix difficulty levels...'
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59] transition-all resize-none'
                />
              </div>

              {/* Count + Type */}
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Number of Questions</label>
                  <input
                    type='number'
                    value={count}
                    onChange={e => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    min={1}
                    max={50}
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 focus:border-[#084A59]'
                  />
                </div>
                <div className='col-span-2'>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Question Type</label>
                  <div className='flex gap-2'>
                    {(['MCQ', 'STRUCTURAL', 'MIXED'] as const).map(t => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => setQuestionType(t)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          questionType === t
                            ? 'bg-[#084A59] text-white border-[#084A59]'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {t === 'MCQ' ? 'Multiple Choice' : t === 'STRUCTURAL' ? 'Essay / Written' : 'Mixed'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className='bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600'>
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || (mode === 'exam' && selectedChapterIds.size === 0)}
                className='w-full py-3 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {generating ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Generating questions...
                  </>
                ) : (
                  <>
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' /></svg>
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          )}

          {/* Review generated questions */}
          {generated.length > 0 && (
            <div className='px-6 py-4 space-y-3'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm font-semibold text-gray-600'>
                  {selected.size} of {generated.length} selected
                </p>
                <button onClick={toggleAll} className='text-xs text-[#084A59] font-semibold hover:underline'>
                  {selected.size === generated.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {generated.map((q, idx) => (
                <div key={idx} className={`border rounded-xl p-4 transition-all ${selected.has(idx) ? 'border-[#084A59] bg-[#084A59]/5' : 'border-gray-200 bg-white'}`}>
                  {editingIdx === idx && editForm ? (
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.questionType === 'MCQ' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {q.questionType}
                        </span>
                        <span className='text-[10px] font-bold text-gray-400'>Editing Q{idx + 1}</span>
                      </div>
                      <textarea
                        value={editForm.questionText}
                        onChange={e => setEditForm({ ...editForm, questionText: e.target.value })}
                        rows={2}
                        className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 resize-none'
                      />
                      {editForm.questionType === 'MCQ' && (
                        <div className='space-y-2'>
                          {editForm.options.map((opt, oi) => (
                            <div key={oi} className='flex items-center gap-2'>
                              <input
                                type='radio'
                                name={`edit-correct-${idx}`}
                                checked={editForm.correctAnswerIndex === oi}
                                onChange={() => setEditForm({ ...editForm, correctAnswerIndex: oi })}
                                className='accent-green-600'
                              />
                              <input
                                value={opt}
                                onChange={e => {
                                  const newOpts = [...editForm.options]
                                  newOpts[oi] = e.target.value
                                  setEditForm({ ...editForm, options: newOpts })
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                className='flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#084A59]/20'
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {editForm.questionType === 'STRUCTURAL' && (
                        <textarea
                          value={editForm.sampleAnswer || ''}
                          onChange={e => setEditForm({ ...editForm, sampleAnswer: e.target.value })}
                          rows={2}
                          placeholder='Sample answer / grading criteria...'
                          className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#084A59]/20 resize-none'
                        />
                      )}
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='text-xs font-semibold text-gray-500'>Points</label>
                          <input
                            type='number'
                            value={editForm.points}
                            onChange={e => setEditForm({ ...editForm, points: Number(e.target.value) })}
                            min={1}
                            className='w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#084A59]/20'
                          />
                        </div>
                        <div>
                          <label className='text-xs font-semibold text-gray-500'>Explanation</label>
                          <input
                            value={editForm.explanation}
                            onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
                            className='w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#084A59]/20'
                          />
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <button onClick={saveEdit} className='px-4 py-1.5 bg-[#084A59] text-white text-xs font-semibold rounded-lg'>Save</button>
                        <button onClick={() => { setEditingIdx(null); setEditForm(null) }} className='px-4 py-1.5 text-xs text-gray-500 font-semibold'>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-start gap-3'>
                      <input
                        type='checkbox'
                        checked={selected.has(idx)}
                        onChange={() => toggleSelect(idx)}
                        className='mt-1 w-4 h-4 accent-[#084A59] rounded cursor-pointer'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-xs font-bold text-gray-400'>Q{idx + 1}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.questionType === 'MCQ' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {q.questionType}
                          </span>
                          <span className='text-[10px] font-semibold text-gray-400'>{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                        </div>
                        <p className='text-sm font-semibold text-[#084A59]'>{q.questionText}</p>
                        {q.questionType === 'MCQ' && q.options.length > 0 && (
                          <div className='mt-1.5 space-y-0.5'>
                            {q.options.map((opt, oi) => (
                              <div key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correctAnswerIndex ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-400'}`}>
                                {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswerIndex ? '✓' : ''}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.questionType === 'STRUCTURAL' && q.sampleAnswer && (
                          <p className='text-xs text-gray-400 mt-1 italic'>Sample: {q.sampleAnswer.slice(0, 100)}...</p>
                        )}
                        {q.explanation && (
                          <p className='text-xs text-gray-400 mt-1 italic'>Explanation: {q.explanation}</p>
                        )}
                      </div>
                      <div className='flex gap-1 shrink-0'>
                        <button onClick={() => startEdit(idx)} className='p-1.5 text-gray-400 hover:text-[#084A59] rounded-lg hover:bg-gray-100 transition-colors' title='Edit'>
                          <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125' /></svg>
                        </button>
                        <button onClick={() => deleteQuestion(idx)} className='p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors' title='Delete'>
                          <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {generated.length > 0 && (
          <div className='px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0'>
            <button onClick={() => { setGenerated([]); setSelected(new Set()); setError('') }} className='px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>
              Regenerate
            </button>
            <button onClick={handleAccept} disabled={selected.size === 0} className='flex-1 py-2.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#011C26] transition-colors text-sm disabled:opacity-50'>
              Add {selected.size} Question{selected.size !== 1 ? 's' : ''} to Draft
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
