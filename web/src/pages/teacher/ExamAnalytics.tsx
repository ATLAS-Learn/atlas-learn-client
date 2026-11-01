import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../../api/client'
import StudentAvatar from '../../components/StudentAvatar'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'

type Exam = { id: string; title: string; subjectId?: string; subject?: { id?: string; name?: string }; subjectName?: string; _count?: { attempts?: number } }
type Attempt = { student?: any; user?: any; studentId?: string; userId?: string; score?: number; percentage?: number; completedAt?: string; createdAt?: string }
type StudentRow = { id: string; student: any; scores: Record<string, number | null> }

const unwrapList = (value: any) => {
  const data = value?.data ?? value
  return Array.isArray(data) ? data : data?.attempts || data?.students || data?.subjects || data?.exams || []
}

const scoreOf = (attempt: Attempt) => {
  const score = attempt.percentage ?? attempt.score
  return typeof score === 'number' ? score : null
}

const studentName = (student: any) => student?.name || student?.email || 'Student'
const schoolName = (student: any) => student?.school?.name || student?.schoolName || (typeof student?.school === 'string' ? student.school : '') || '—'
const examSubject = (exam: Exam, subjects: any[]) =>
  exam.subject?.name ||
  exam.subjectName ||
  subjects.find(subject => subject.id === exam.subjectId)?.name ||
  '—'

export default function ExamAnalytics() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({})
  const [groups, setGroups] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('exam-period-groups') || '{}') } catch { return {} }
  })
  const [groupName, setGroupName] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAttempts, setLoadingAttempts] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      api.getExamSubjects().then(result => {
        const list = unwrapList(result)
        setSubjects(list)
      }).catch(() => setSubjects([]))
    }
  }, [isAdmin])

  useEffect(() => {
    setLoading(true)
    setSelectedIds([])
    setAttempts({})
    api.getExams({ limit: 200, subjectId: subjectId || undefined }).then(result => {
      const list = unwrapList(result)
      setExams(list)
      if (list[0]) setSelectedIds([list[0].id])
    }).catch(() => setExams([])).finally(() => setLoading(false))
  }, [subjectId])

  useEffect(() => {
    const missing = selectedIds.filter(id => !attempts[id])
    if (!missing.length) return
    setLoadingAttempts(true)
    Promise.all(missing.map(async id => [id, unwrapList(await api.getExamAttempts(id, { limit: 1000 }))] as const))
      .then(results => setAttempts(previous => ({ ...previous, ...Object.fromEntries(results) })))
      .catch(() => {})
      .finally(() => setLoadingAttempts(false))
  }, [selectedIds, attempts])

  const selectedExams = exams.filter(exam => selectedIds.includes(exam.id))
  const selectedSubjectNames = [...new Set(selectedExams.map(exam => examSubject(exam, subjects)).filter(name => name !== '—'))]
  const rows = useMemo<StudentRow[]>(() => {
    const byStudent = new Map<string, StudentRow>()
    selectedExams.forEach(exam => {
      ;(attempts[exam.id] || []).forEach(attempt => {
        const student = attempt.student || attempt.user || {}
        const id = attempt.studentId || attempt.userId || student.id
        if (!id) return
        const row = byStudent.get(id) || { id, student, scores: {} }
        row.student = { ...row.student, ...student }
        row.scores[exam.id] = scoreOf(attempt)
        byStudent.set(id, row)
      })
    })
    return [...byStudent.values()].sort((a, b) => (a.student.name || a.student.email || '').localeCompare(b.student.name || b.student.email || ''))
  }, [attempts, selectedExams])

  const average = (scores: (number | null)[]) => {
    const valid = scores.filter((score): score is number => typeof score === 'number')
    return valid.length ? valid.reduce((sum, score) => sum + score, 0) / valid.length : null
  }

  const saveGroup = () => {
    const name = groupName.trim()
    if (!name || !selectedIds.length) return
    const next = { ...groups, [name]: selectedIds }
    setGroups(next)
    localStorage.setItem('exam-period-groups', JSON.stringify(next))
    setGroupName('')
  }

  const loadImageData = async (image?: string) => {
    if (!image) return null
    try {
      const url = image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL || '/api/v1'}${image}`
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) return null
      const blob = await response.blob()
      return await new Promise<{ data: string; format: 'PNG' | 'JPEG' } | null>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve({ data: String(reader.result), format: blob.type.includes('png') ? 'PNG' : 'JPEG' })
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  const createReportPdf = async (row: StudentRow) => {
    const pdf = new jsPDF()
    const name = studentName(row.student)
    const school = schoolName(row.student)
    const subjectsInReport = selectedSubjectNames.length ? selectedSubjectNames.join(', ') : '—'
    const image = await loadImageData(row.student.image || row.student.profileImage || row.student.avatar)
    if (image) pdf.addImage(image.data, image.format, 150, 15, 35, 35)
    pdf.setTextColor('#084A59')
    pdf.setFontSize(20)
    pdf.text('Apex Learn - Exam Report Card', 20, 25)
    pdf.setFontSize(14)
    pdf.text(name, 20, 38)
    pdf.setFontSize(10)
    pdf.setTextColor('#666666')
    pdf.text(row.student.email || '', 20, 45)
    pdf.text(`School: ${school}`, 20, 52)
    pdf.text(`Subject: ${subjectsInReport}`, 20, 59)
    let y = 72
    pdf.setTextColor('#084A59')
    selectedExams.forEach(exam => {
      pdf.text(`${examSubject(exam, subjects)} - ${exam.title}`, 20, y)
      pdf.text(row.scores[exam.id] == null ? '—' : `${row.scores[exam.id]}%`, 150, y)
      y += 9
    })
    y += 6
    pdf.setFontSize(13)
    const avg = average(selectedExams.map(exam => row.scores[exam.id]))
    pdf.text(`Total average: ${avg == null ? '—' : `${avg.toFixed(1)}%`}`, 20, y)
    return pdf
  }

  const downloadReport = async (row: StudentRow) => {
    const safeName = (row.student.name || row.student.email || 'student').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    ;(await createReportPdf(row)).save(`${safeName}-report-card.pdf`)
  }

  const downloadReports = async (students: StudentRow[]) => {
    if (!students.length) return
    const zip = new JSZip()
    await Promise.all(students.map(async row => {
      const safeName = (row.student.name || row.student.email || row.id).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      zip.file(`${safeName}-report-card.pdf`, (await createReportPdf(row)).output('arraybuffer'))
    }))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'apex-learn-report-cards.zip'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className='flex items-center justify-center h-[60vh] text-gray-400'>Loading exam analytics...</div>

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-[#084A59]'>Exam Analytics</h2>
        <p className='text-sm text-gray-400 mt-0.5'>Compare student performance by exam or saved assessment period.</p>
      </div>

      <div className='bg-white rounded-2xl border border-gray-200 p-5 space-y-4'>
        {isAdmin && (
          <div className='flex flex-wrap items-center gap-3'>
            <label htmlFor='analytics-subject' className='text-sm font-semibold text-gray-600'>Subject:</label>
            <select
              id='analytics-subject'
              value={subjectId}
              onChange={event => setSubjectId(event.target.value)}
              className='min-w-56 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138]'
            >
              <option value=''>All subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name || subject.title}</option>
              ))}
            </select>
            {subjectId && <span className='text-xs text-gray-400'>All charts, students, periods, and exports are scoped to this subject.</span>}
          </div>
        )}
        <div className='flex flex-wrap gap-2'>
          {exams.map(exam => (
            <label key={exam.id} className='flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50'>
              <input type='checkbox' checked={selectedIds.includes(exam.id)} onChange={() => setSelectedIds(previous => previous.includes(exam.id) ? previous.filter(id => id !== exam.id) : [...previous, exam.id])} />
              <span>{exam.title}</span>
            </label>
          ))}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <select className='px-3 py-2 border border-gray-200 rounded-xl text-sm' defaultValue='' onChange={event => event.target.value && setSelectedIds((groups[event.target.value] || []).filter(id => exams.some(exam => exam.id === id)))}>
            <option value=''>Load saved period</option>
            {Object.keys(groups).map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <input value={groupName} onChange={event => setGroupName(event.target.value)} placeholder='Name selected exams' className='px-3 py-2 border border-gray-200 rounded-xl text-sm' />
          <button onClick={saveGroup} className='px-3 py-2 rounded-xl bg-[#084A59] text-white text-sm font-semibold'>Save period</button>
          <button onClick={() => downloadReports(rows)} disabled={!rows.length} className='px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40'>Download all PDFs</button>
        </div>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-2xl border border-gray-200 p-5'>
          <h3 className='font-bold text-[#084A59] mb-4'>Average score by exam</h3>
          <div className='space-y-4'>
            {selectedExams.map(exam => {
              const avg = average((attempts[exam.id] || []).map(scoreOf))
              return <div key={exam.id}><div className='flex justify-between text-sm mb-1'><span className='font-medium truncate'>{exam.title}</span><span className='font-bold'>{avg == null ? '—' : `${avg.toFixed(1)}%`}</span></div><div className='h-3 bg-gray-100 rounded-full overflow-hidden'><div className='h-full bg-[#F2B138] rounded-full' style={{ width: `${Math.min(avg || 0, 100)}%` }} /></div></div>
            })}
            {!selectedExams.length && <p className='text-sm text-gray-400'>Select one or more exams.</p>}
          </div>
        </div>
        <div className='bg-white rounded-2xl border border-gray-200 p-5'>
          <h3 className='font-bold text-[#084A59] mb-4'>Combined period average</h3>
          <div className='text-5xl font-bold text-[#084A59]'>{average(rows.flatMap(row => selectedExams.map(exam => row.scores[exam.id])))?.toFixed(1) || '—'}<span className='text-2xl'>%</span></div>
          <p className='text-sm text-gray-400 mt-2'>{rows.length} students with attempts across {selectedExams.length} exam{selectedExams.length === 1 ? '' : 's'}.</p>
        </div>
      </div>

      <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-100 flex justify-between items-center'><h3 className='font-bold text-[#084A59]'>Student performance</h3>{loadingAttempts && <span className='text-xs text-gray-400'>Loading scores...</span>}</div>
        <div className='overflow-x-auto'><table className='w-full'><thead><tr className='bg-gray-50/80'><th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Student</th><th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>School</th><th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Subject</th>{selectedExams.map(exam => <th key={exam.id} className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>{exam.title}</th>)}<th className='text-left px-5 py-3 text-xs text-gray-500 uppercase'>Total average</th><th /></tr></thead><tbody className='divide-y divide-gray-50'>{rows.map(row => <tr key={row.id} className='hover:bg-gray-50/50'><td className='px-5 py-3'><div className='flex items-center gap-3'><StudentAvatar student={row.student} size='sm' /><span className='text-sm font-semibold text-[#084A59]'>{studentName(row.student)}</span></div></td><td className='px-5 py-3 text-sm text-gray-600'>{schoolName(row.student)}</td><td className='px-5 py-3 text-sm text-gray-600'>{selectedSubjectNames.join(', ') || '—'}</td>{selectedExams.map(exam => <td key={exam.id} className='px-5 py-3 text-sm font-medium'>{row.scores[exam.id] == null ? '—' : `${row.scores[exam.id]}%`}</td>)}<td className='px-5 py-3 text-sm font-bold text-[#084A59]'>{average(selectedExams.map(exam => row.scores[exam.id]))?.toFixed(1) || '—'}%</td><td className='px-5 py-3 text-right'><button onClick={() => setSelectedStudent(row)} className='text-xs font-semibold text-[#084A59]'>Details</button></td></tr>)}{!rows.length && <tr><td colSpan={selectedExams.length + 6} className='px-5 py-12 text-center text-gray-400'>No exam attempts found.</td></tr>}</tbody></table></div>
      </div>

      {selectedStudent && <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4' onClick={() => setSelectedStudent(null)}><div className='bg-white rounded-2xl max-w-lg w-full p-6' onClick={event => event.stopPropagation()}><div className='flex items-center gap-3 mb-5'><StudentAvatar student={selectedStudent.student} size='lg' /><div><h3 className='text-xl font-bold text-[#084A59]'>{studentName(selectedStudent.student)}</h3><p className='text-sm text-gray-400'>{selectedStudent.student.email}</p><p className='text-sm text-gray-500'>School: {schoolName(selectedStudent.student)}</p><p className='text-sm text-gray-500'>Subject: {selectedSubjectNames.join(', ') || '—'}</p></div></div><div className='space-y-2'>{selectedExams.map(exam => <div key={exam.id} className='flex justify-between border-b border-gray-100 py-2 text-sm'><span>{examSubject(exam, subjects)} · {exam.title}</span><strong>{selectedStudent.scores[exam.id] == null ? '—' : `${selectedStudent.scores[exam.id]}%`}</strong></div>)}</div><p className='mt-4 text-right font-bold text-[#084A59]'>Total average: {average(selectedExams.map(exam => selectedStudent.scores[exam.id]))?.toFixed(1) || '—'}%</p><div className='flex gap-2 mt-5'><button onClick={() => downloadReport(selectedStudent)} className='flex-1 py-2 rounded-xl bg-[#084A59] text-white text-sm font-semibold'>Download PDF</button><button onClick={() => setSelectedStudent(null)} className='px-4 py-2 rounded-xl border border-gray-200 text-sm'>Close</button></div></div></div>}
    </div>
  )
}
