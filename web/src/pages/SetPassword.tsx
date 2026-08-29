import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const isTeacher = userInfo?.role === 'teacher'
  const totalSteps = isTeacher ? 3 : 2

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invite link')
      setValidating(false)
      return
    }
    api.validateInviteToken(token)
      .then((res) => {
        const user = res?.user
        setUserInfo(user)
        if (user?.name) setName(user.name)
        if (user?.school) setSchool(user.school)
        if (user?.teacherSubjects?.length) setSelectedSubjects(user.teacherSubjects)
        setValidating(false)
      })
      .catch((err: any) => {
        setError(err.message || 'Invalid or expired invite link')
        setValidating(false)
      })
  }, [token])

  useEffect(() => {
    if (isTeacher && step === 3 && subjects.length === 0) {
      api.getSubjects().then((res) => {
        setSubjects(res?.data ?? [])
      }).catch(() => {})
    }
  }, [isTeacher, step, subjects.length])

  const handlePasswordSubmit = (e: React.FormEvent) => {
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
    setStep(2)
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    if (isTeacher) {
      setStep(3)
    } else {
      handleFinalSubmit()
    }
  }

  const handleFinalSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const profile: any = {}
      if (name.trim()) profile.name = name.trim()
      if (school.trim()) profile.school = school.trim()
      if (isTeacher && selectedSubjects.length > 0) profile.teacherSubjects = selectedSubjects
      await api.setPassword(token!, password, profile)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
        <div className='text-center mb-6'>
          <div className='w-14 h-14 bg-[#F2B138]/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <img src='/icon.png' alt='Apex Learn' className='w-8 h-8' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>
            {success ? 'All Set!' : isTeacher ? 'Complete Your Profile' : 'Set Your Password'}
          </h1>
          <p className='text-gray-500 mt-1'>Welcome to Apex Learn</p>
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
            <button onClick={() => navigate('/dashboard')} className='px-6 py-2.5 bg-[#084A59] text-white rounded-lg hover:bg-[#011C26] transition-colors'>
              Go to Login
            </button>
          </div>
        ) : success ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Account Ready</h2>
            <p className='text-gray-500 mb-6'>Your profile is set up. You can now log in.</p>
            <button onClick={() => navigate('/dashboard')} className='px-6 py-2.5 bg-[#084A59] text-white rounded-lg hover:bg-[#011C26] transition-colors'>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className='bg-gray-50 rounded-lg p-4 mb-6'>
              <p className='text-sm text-gray-600'>Setting up account for:</p>
              <p className='text-base font-medium text-gray-900'>{userInfo?.email}</p>
              <p className='text-sm text-gray-500 capitalize'>{userInfo?.role}</p>
            </div>

            {/* Step indicator */}
            <div className='flex items-center justify-center gap-2 mb-6'>
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div key={s} className='flex items-center gap-2'>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s ? 'bg-[#084A59] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{s}</div>
                  {s < totalSteps && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#084A59]' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>{error}</div>}

            {/* Step 1: Password */}
            {step === 1 && (
              <form onSubmit={handlePasswordSubmit}>
                <h3 className='text-sm font-semibold text-gray-700 mb-4'>Step 1 — Set Password</h3>
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-600 mb-2'>New Password</label>
                  <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                    placeholder='Min. 8 characters'
                  />
                </div>
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-600 mb-2'>Confirm Password</label>
                  <input
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                    placeholder='Repeat password'
                  />
                </div>
                <button type='submit' className='w-full py-3 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors text-base'>
                  Continue
                </button>
              </form>
            )}

            {/* Step 2: Profile */}
            {step === 2 && (
              <form onSubmit={handleProfileSubmit}>
                <h3 className='text-sm font-semibold text-gray-700 mb-4'>Step 2 — Your Info</h3>
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-600 mb-2'>Full Name</label>
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                    placeholder='e.g. Jane Smith'
                  />
                </div>
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-600 mb-2'>School <span className='text-gray-400'>(optional)</span></label>
                  <input
                    type='text'
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                    placeholder='e.g. Lincoln High School'
                  />
                </div>
                <div className='flex gap-3'>
                  <button type='button' onClick={() => setStep(1)} className='flex-1 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>
                    Back
                  </button>
                  <button type='submit' className='flex-1 py-3 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors text-base'>
                    {isTeacher ? 'Continue' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Subject Selection (teachers only) */}
            {step === 3 && isTeacher && (
              <div>
                <h3 className='text-sm font-semibold text-gray-700 mb-2'>Step 3 — Select Subjects</h3>
                <p className='text-xs text-gray-400 mb-4'>Choose the subjects you teach</p>
                {subjects.length === 0 ? (
                  <div className='text-center py-6'>
                    <div className='w-6 h-6 border-2 border-[#F2B138] border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                    <p className='text-sm text-gray-400'>Loading subjects...</p>
                  </div>
                ) : (
                  <div className='max-h-64 overflow-y-auto space-y-2 mb-6'>
                    {subjects.map((subj) => (
                      <button
                        key={subj.id}
                        type='button'
                        onClick={() => toggleSubject(subj.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                          selectedSubjects.includes(subj.id)
                            ? 'border-[#084A59] bg-[#084A59]/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedSubjects.includes(subj.id)
                            ? 'border-[#084A59] bg-[#084A59]'
                            : 'border-gray-300'
                        }`}>
                          {selectedSubjects.includes(subj.id) && (
                            <svg className='w-3 h-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                              <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className='text-sm font-medium text-gray-900'>{subj.name}</p>
                          {subj.code && <p className='text-xs text-gray-400'>{subj.code}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className='flex gap-3'>
                  <button type='button' onClick={() => setStep(2)} className='flex-1 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>
                    Back
                  </button>
                  <button
                    type='button'
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className='flex-1 py-3 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors disabled:opacity-50 text-base'
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
