import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
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

        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Forgot Password</h1>
        <p className='text-gray-500 mb-8'>Enter your email and we'll send you a reset link.</p>

        {success ? (
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Check Your Email</h2>
            <p className='text-gray-500 mb-6'>We've sent a password reset link to <strong>{email}</strong></p>
            <button onClick={() => navigate('/dashboard')} className='px-6 py-2.5 bg-[#1F2524] text-white rounded-lg hover:bg-[#282F2E] transition-colors'>
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>{error}</div>}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-600 mb-2'>Email</label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#1F2524] focus:ring-1 focus:ring-[#1F2524]/10 transition-all'
                placeholder='you@example.com'
              />
            </div>
            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 bg-[#1F2524] text-white font-semibold rounded-lg hover:bg-[#282F2E] transition-colors disabled:opacity-50 text-base'
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
