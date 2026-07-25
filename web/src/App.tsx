import { Routes, Route, Navigate } from 'react-router-dom'
import { api } from './api/client'
import Landing from './pages/landing/Landing'
import Login from './pages/Login'
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSubjects from './pages/admin/Subjects'
import AdminRoleUpgrades from './pages/admin/RoleUpgrades'
import TeacherLayout from './pages/teacher/Layout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherStudents from './pages/teacher/Students'
import TeacherStudentDetail from './pages/teacher/StudentDetail'
import TeacherContent from './pages/teacher/Content'
import TeacherQuizzes from './pages/teacher/Quizzes'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!api.isLoggedIn()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

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
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="role-upgrades" element={<AdminRoleUpgrades />} />
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
        <Route path="content" element={<TeacherContent />} />
        <Route path="quizzes" element={<TeacherQuizzes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
