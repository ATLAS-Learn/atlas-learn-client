import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { api } from './api/client'
import Landing from './pages/landing/Landing'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SetPassword from './pages/SetPassword'
import SuperadminLayout from './pages/superadmin/Layout'
import SuperadminDashboard from './pages/superadmin/Dashboard'
import SuperadminUsers from './pages/superadmin/Users'
import SuperadminSchools from './pages/superadmin/Schools'
import SuperadminSchoolStudents from './pages/superadmin/SchoolStudents'
import SuperadminFeedback from './pages/superadmin/Feedback'
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSubjectList from './pages/admin/SubjectList'
import AdminSubjectDetail from './pages/admin/SubjectDetail'
import AdminChapterDetail from './pages/admin/ChapterDetail'
import AdminRoleUpgrades from './pages/admin/RoleUpgrades'
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

type Role = 'student' | 'teacher' | 'admin' | 'superadmin';

function roleHome(role: Role) {
  if (role === 'superadmin') return '/superadmin';
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/dashboard';
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const navigate = useNavigate()
  const allowedRoleKey = allowedRoles.join(',')

  useEffect(() => {
    api.getCurrentUser()
      .then((user) => {
        if (!allowedRoleKey.split(',').includes(user?.role)) {
          navigate(roleHome(user?.role as Role), { replace: true });
          return;
        }
        setValid(true);
      })
      .catch(() => {
        api.clearUser()
        navigate('/dashboard', { replace: true })
      })
      .finally(() => setChecking(false))
  }, [allowedRoleKey, navigate])

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

      {/* Superadmin Routes */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperadminDashboard />} />
        <Route path="users" element={<SuperadminUsers />} />
        <Route path="schools" element={<SuperadminSchools />} />
        <Route path="schools/:schoolId" element={<SuperadminSchoolStudents />} />
        <Route path="feedback" element={<SuperadminFeedback />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subjects" element={<AdminSubjectList />} />
        <Route path="subjects/:subjectId" element={<AdminSubjectDetail />} />
        <Route path="subjects/:subjectId/chapters/:chapterId" element={<AdminChapterDetail />} />
        <Route path="quizzes" element={<TeacherQuizList />} />
        <Route path="quizzes/:quizId" element={<TeacherQuizDetail />} />
        <Route path="role-upgrades" element={<AdminRoleUpgrades />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'superadmin']}>
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
