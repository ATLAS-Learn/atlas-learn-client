import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'admin'
  const [role, setRole] = useState<'admin' | 'teacher'>(initialRole === 'teacher' ? 'teacher' : 'admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(email, password)
      const user = res?.user || res?.data?.user || res?.data
      const userRole = user?.role
      if (role === 'admin' && userRole !== 'admin') {
        setError('Access denied. Admin accounts only.')
        api.clearToken()
        return
      }
      if (role === 'teacher' && userRole !== 'teacher' && userRole !== 'admin') {
        setError('Access denied. Teacher or admin accounts only.')
        api.clearToken()
        return
      }
      navigate(userRole === 'admin' ? '/admin' : '/teacher')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Atlas Learn" className="h-10" />
          </Link>
          <h1 className="text-2xl font-bold text-[#282F2E]">
            {role === 'admin' ? 'Admin Login' : 'Teacher Login'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {role === 'admin' ? 'Sign in to access the admin dashboard' : 'Sign in to access the teacher portal'}
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
          {(['admin', 'teacher'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${role === r ? 'bg-white text-[#282F2E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {r === 'admin' ? 'Admin' : 'Teacher'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#282F2E] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138] focus:ring-2 focus:ring-[#F2B138]/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#282F2E] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138] focus:ring-2 focus:ring-[#F2B138]/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#D49A2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/" className="text-[#F2B138] font-semibold">Back to home</Link>
        </p>
      </div>
    </div>
  )
}
