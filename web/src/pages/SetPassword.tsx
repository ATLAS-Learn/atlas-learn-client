import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invite link')
      setValidating(false)
      return
    }
    api.validateInviteToken(token)
      .then((res) => {
        setUserInfo(res?.user)
        setValidating(false)
      })
      .catch((err: any) => {
        setError(err.message || 'Invalid or expired invite link')
        setValidating(false)
      })
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
      await api.setPassword(token!, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
        <div className='text-center mb-6'>
          <div className='w-14 h-14 bg-[#F2B138]/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <img src='/logo192.png' alt='Atlas Learn' className='w-8 h-8' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>Set Your Password</h1>
          <p className='text-gray-500 mt-1'>Welcome to Atlas Learn</p>
        </div>

        {validating ? (
          <div className='text-center py-8'>
            <div className='w-8 h-8 border-3 border-[#F2B138] border-t-transparent rounded-full animate-spin mx-auto mb-3' />
            <p className='text-gray-500'>Validating invite link...</p>
          </div>
        ) : error && !userInfo ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-red-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Invalid Link</h2>
            <p className='text-gray-500 mb-6'>{error}</p>
            <button onClick={() => navigate('/dashboard')} className='px-6 py-2.5 bg-[#1F2524] text-white rounded-lg hover:bg-[#282F2E] transition-colors'>
              Go to Login
            </button>
          </div>
        ) : success ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Password Set Successfully</h2>
            <p className='text-gray-500 mb-6'>Your account is ready. You can now log in.</p>
            <button onClick={() => navigate('/dashboard')} className='px-6 py-2.5 bg-[#1F2524] text-white rounded-lg hover:bg-[#282F2E] transition-colors'>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className='bg-gray-50 rounded-lg p-4 mb-6'>
              <p className='text-sm text-gray-600'>Setting password for:</p>
              <p className='text-base font-medium text-gray-900'>{userInfo?.email}</p>
              <p className='text-sm text-gray-500'>{userInfo?.name} ({userInfo?.role})</p>
            </div>
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
                disabled={loading}
                className='w-full py-3 bg-[#1F2524] text-white font-semibold rounded-lg hover:bg-[#282F2E] transition-colors disabled:opacity-50 text-base'
              >
                {loading ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
