import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.resetPassword(token!, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
        <button onClick={() => navigate('/dashboard')} className='flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors'>
          <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' /></svg>
          Back to login
        </button>

        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Reset Password</h1>
        <p className='text-gray-500 mb-8'>Enter your new password below.</p>

        {success ? (
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Password Reset Successfully</h2>
            <p className='text-gray-500 mb-6'>You can now log in with your new password.</p>
            <button onClick={() => navigate('/dashboard')} className='px-6 py-2.5 bg-[#1F2524] text-white rounded-lg hover:bg-[#282F2E] transition-colors'>
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>{error}</div>}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-600 mb-2'>New Password</label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#1F2524] focus:ring-1 focus:ring-[#1F2524]/10 transition-all'
                placeholder='••••••••'
              />
            </div>
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-600 mb-2'>Confirm Password</label>
              <input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#1F2524] focus:ring-1 focus:ring-[#1F2524]/10 transition-all'
                placeholder='••••••••'
              />
            </div>
            <button
              type='submit'
              disabled={loading || !token}
              className='w-full py-3 bg-[#1F2524] text-white font-semibold rounded-lg hover:bg-[#282F2E] transition-colors disabled:opacity-50 text-base'
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
