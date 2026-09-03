import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { api } from './api/client'
import Landing from './pages/landing/Landing'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SetPassword from './pages/SetPassword'
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSubjectList from './pages/admin/SubjectList'
import AdminSubjectDetail from './pages/admin/SubjectDetail'
import AdminChapterDetail from './pages/admin/ChapterDetail'
import AdminRoleUpgrades from './pages/admin/RoleUpgrades'
import AdminFeedback from './pages/admin/Feedback'
import TeacherLayout from './pages/teacher/Layout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherStudents from './pages/teacher/Students'
import TeacherStudentDetail from './pages/teacher/StudentDetail'
import TeacherContentList from './pages/teacher/ContentList'
import TeacherSubjectDetail from './pages/teacher/SubjectDetail'
import TeacherChapterDetail from './pages/teacher/ChapterDetail'
import TeacherQuizList from './pages/teacher/QuizList'
import TeacherQuizDetail from './pages/teacher/QuizDetail'
import TeacherExamList from './pages/teacher/ExamList'
import TeacherExamDetail from './pages/teacher/ExamDetail'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.getCurrentUser()
      .then(() => setValid(true))
      .catch(() => {
        api.clearUser()
        navigate('/dashboard', { replace: true })
      })
      .finally(() => setChecking(false))
  }, [navigate])

  if (checking) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }
  if (!valid) return null
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subjects" element={<AdminSubjectList />} />
        <Route path="subjects/:subjectId" element={<AdminSubjectDetail />} />
        <Route path="subjects/:subjectId/chapters/:chapterId" element={<AdminChapterDetail />} />
        <Route path="role-upgrades" element={<AdminRoleUpgrades />} />
        <Route path="feedback" element={<AdminFeedback />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="students/:studentId" element={<TeacherStudentDetail />} />
        <Route path="content" element={<TeacherContentList />} />
        <Route path="content/:subjectId" element={<TeacherSubjectDetail />} />
        <Route path="content/:subjectId/chapters/:chapterId" element={<TeacherChapterDetail />} />
        <Route path="quizzes" element={<TeacherQuizList />} />
        <Route path="quizzes/:quizId" element={<TeacherQuizDetail />} />
        <Route path="exams" element={<TeacherExamList />} />
        <Route path="exams/:examId" element={<TeacherExamDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
