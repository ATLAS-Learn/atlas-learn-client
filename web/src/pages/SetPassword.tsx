import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isTeacher = userInfo?.role === 'teacher';
  const totalSteps = isTeacher ? 3 : 2;

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invite link');
      setValidating(false);
      return;
    }
    api
      .validateInviteToken(token)
      .then((res) => {
        const user = res?.user;
        setUserInfo(user);
        if (user?.name) setName(user.name);
        if (user?.school) setSchool(user.school);
        if (user?.teacherSubjects?.length)
          setSelectedSubjects(user.teacherSubjects);
        setValidating(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Invalid or expired invite link');
        setValidating(false);
      });
  }, [token]);

  useEffect(() => {
    if (isTeacher && step === 3 && subjects.length === 0) {
      api
        .getSubjects()
        .then((res) => {
          setSubjects(res?.data ?? []);
        })
        .catch(() => {});
    }
  }, [isTeacher, step, subjects.length]);

  useEffect(() => {
    if (schools.length === 0) {
      api
        .getSchools()
        .then((res) => {
          setSchools(res?.data ?? []);
        })
        .catch(() => {});
    }
  }, [schools.length]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    if (isTeacher) {
      setStep(3);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const profile: any = {};
      if (name.trim()) profile.name = name.trim();
      if (school.trim()) profile.school = school.trim();
      if (isTeacher && selectedSubjects.length > 0)
        profile.teacherSubjects = selectedSubjects;
      await api.setPassword(token!, password, profile);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // Loading state
  if (validating) {
    return (
      <div className='min-h-screen flex'>
        <div className='w-full lg:w-1/2 flex flex-col justify-center px-10 md:px-16 bg-white'>
          <div className='w-full max-w-md mx-auto text-center'>
            <img src='/logo-console.png' alt='Apex Learn' className='h-24 mx-auto mb-10' />
            <div className='w-8 h-8 border-3 border-[#084A59] border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-gray-500'>Validating invite link...</p>
          </div>
        </div>
        <div className='hidden lg:flex w-1/2 bg-[#084A59]/80 backdrop-blur-md relative overflow-hidden flex-col justify-center items-start'>
          <div className='absolute top-20 right-20 w-72 h-72 bg-[#F2B138]/10 rounded-full blur-3xl' />
          <div className='absolute bottom-32 left-16 w-48 h-48 bg-[#F2B138]/5 rounded-full blur-2xl' />
          <div className='relative z-10 flex flex-col justify-center px-16 max-w-xl'>
            <h2 className='text-4xl font-extrabold text-white leading-tight mb-5'>
              Welcome to<br /><span className='text-[#F2B138]'>Apex Learn</span>
            </h2>
            <p className='text-gray-400 text-lg leading-relaxed'>
              Your journey to better learning starts here. Set up your account in just a few steps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid link)
  if (error && !userInfo) {
    return (
      <div className='min-h-screen flex'>
        <div className='w-full lg:w-1/2 flex flex-col justify-center px-10 md:px-16 bg-white'>
          <div className='w-full max-w-md mx-auto text-center'>
            <img src='/logo-console.png' alt='Apex Learn' className='h-24 mx-auto mb-10' />
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-red-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Invalid Link</h2>
            <p className='text-gray-500 mb-6'>{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className='px-6 py-3 bg-[#084A59] text-white rounded-lg hover:bg-[#011C26] transition-colors font-semibold'
            >
              Go to Login
            </button>
          </div>
        </div>
        <div className='hidden lg:flex w-1/2 bg-[#084A59]/80 backdrop-blur-md relative overflow-hidden flex-col justify-center items-start'>
          <div className='absolute top-20 right-20 w-72 h-72 bg-[#F2B138]/10 rounded-full blur-3xl' />
          <div className='absolute bottom-32 left-16 w-48 h-48 bg-[#F2B138]/5 rounded-full blur-2xl' />
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className='min-h-screen flex'>
        <div className='w-full lg:w-1/2 flex flex-col justify-center px-10 md:px-16 bg-white'>
          <div className='w-full max-w-md mx-auto text-center'>
            <img src='/logo-console.png' alt='Apex Learn' className='h-24 mx-auto mb-10' />
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Account Ready!</h2>
            <p className='text-gray-500 mb-6'>Your profile is set up. You can now sign in.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className='px-6 py-3 bg-[#084A59] text-white rounded-lg hover:bg-[#011C26] transition-colors font-semibold'
            >
              Sign In
            </button>
          </div>
        </div>
        <div className='hidden lg:flex w-1/2 bg-[#084A59]/80 backdrop-blur-md relative overflow-hidden flex-col justify-center items-start'>
          <div className='absolute top-20 right-20 w-72 h-72 bg-[#F2B138]/10 rounded-full blur-3xl' />
          <div className='absolute bottom-32 left-16 w-48 h-48 bg-[#F2B138]/5 rounded-full blur-2xl' />
          <div className='relative z-10 flex flex-col justify-center px-16 max-w-xl'>
            <h2 className='text-4xl font-extrabold text-white leading-tight mb-5'>
              You're<br /><span className='text-[#F2B138]'>all set!</span>
            </h2>
            <p className='text-gray-400 text-lg leading-relaxed'>
              Welcome to the future of learning. Start exploring your courses and tracking your progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className='min-h-screen flex'>
      {/* Left: Form */}
      <div className='w-full lg:w-1/2 flex flex-col justify-center px-10 md:px-16 bg-white'>
        <div className='w-full max-w-md mx-auto'>
          <div className='flex justify-center mb-10'>
            <img src='/logo-console.png' alt='Apex Learn' className='h-24' />
          </div>

          <h1 className='text-3xl font-bold text-[#084A59] mb-2'>
            {isTeacher ? 'Complete Your Profile' : 'Set Your Password'}
          </h1>
          <p className='text-base text-gray-500 mb-2'>
            {step === 1
              ? 'Create a secure password for your account'
              : step === 2
                ? 'Tell us a bit about yourself'
                : 'Select the subjects you teach'}
          </p>
          <p className='text-sm text-gray-400 mb-8'>
            Setting up account for <span className='font-medium text-[#084A59]'>{userInfo?.email}</span>
          </p>

          {/* Step indicator */}
          <div className='flex items-center gap-2 mb-8'>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className='flex items-center gap-2'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s
                      ? 'bg-[#084A59] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < totalSteps && (
                  <div
                    className={`w-10 h-0.5 ${step > s ? 'bg-[#084A59]' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-500'>
              {error}
            </div>
          )}

          {/* Step 1: Password */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit}>
              <div className='mb-5'>
                <label className='block text-sm font-medium text-gray-600 mb-2'>
                  New Password
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                  placeholder='Min. 8 characters'
                />
              </div>
              <div className='mb-7'>
                <label className='block text-sm font-medium text-gray-600 mb-2'>
                  Confirm Password
                </label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                  placeholder='Repeat password'
                />
              </div>
              <button
                type='submit'
                className='w-full py-3.5 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors text-base'
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <form
              onSubmit={handleProfileSubmit}
              onClick={() => setShowSchoolDropdown(false)}
            >
              <div className='mb-5'>
                <label className='block text-sm font-medium text-gray-600 mb-2'>
                  Full Name
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                  placeholder='e.g. Jane Smith'
                />
              </div>
              <div className='mb-7 relative'>
                <label className='block text-sm font-medium text-gray-600 mb-2'>
                  School <span className='text-gray-400'>(optional)</span>
                </label>
                <input
                  type='text'
                  value={showSchoolDropdown ? schoolSearch : school}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setSchool(e.target.value);
                    setShowSchoolDropdown(true);
                  }}
                  onFocus={() => {
                    setSchoolSearch('');
                    setShowSchoolDropdown(true);
                  }}
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                  placeholder='Search for your school...'
                />
                {showSchoolDropdown && schools.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                    {schools
                      .filter(
                        (s) =>
                          !schoolSearch ||
                          s.name
                            .toLowerCase()
                            .includes(schoolSearch.toLowerCase()),
                      )
                      .slice(0, 20)
                      .map((s) => (
                        <button
                          key={s.id}
                          type='button'
                          onClick={() => {
                            setSchool(s.name);
                            setSchoolSearch('');
                            setShowSchoolDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${school === s.name ? 'bg-[#084A59]/5 text-[#084A59] font-medium' : 'text-gray-700'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    {schools.filter(
                      (s) =>
                        !schoolSearch ||
                        s.name
                          .toLowerCase()
                          .includes(schoolSearch.toLowerCase()),
                    ).length === 0 && (
                      <div className='px-4 py-3 text-sm text-gray-400'>
                        No schools found
                      </div>
                    )}
                  </div>
                )}
                {school && !showSchoolDropdown && (
                  <button
                    type='button'
                    onClick={() => {
                      setSchool('');
                      setSchoolSearch('');
                    }}
                    className='mt-1 text-xs text-red-400 hover:text-red-600'
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => setStep(1)}
                  className='flex-1 py-3.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  Back
                </button>
                <button
                  type='submit'
                  className='flex-1 py-3.5 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors text-base'
                >
                  {isTeacher ? 'Continue' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Subject Selection (teachers only) */}
          {step === 3 && isTeacher && (
            <div>
              {subjects.length === 0 ? (
                <div className='text-center py-6'>
                  <div className='w-6 h-6 border-2 border-[#084A59] border-t-transparent rounded-full animate-spin mx-auto mb-2' />
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
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selectedSubjects.includes(subj.id)
                            ? 'border-[#084A59] bg-[#084A59]'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedSubjects.includes(subj.id) && (
                          <svg
                            className='w-3 h-3 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {subj.name}
                        </p>
                        {subj.code && (
                          <p className='text-xs text-gray-400'>{subj.code}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => setStep(2)}
                  className='flex-1 py-3.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  Back
                </button>
                <button
                  type='button'
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className='flex-1 py-3.5 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors disabled:opacity-50 text-base'
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Branding Panel */}
      <div className='hidden lg:flex w-1/2 bg-[#084A59]/80 backdrop-blur-md relative overflow-hidden flex-col justify-center items-start'>
        <div className='absolute top-20 right-20 w-72 h-72 bg-[#F2B138]/10 rounded-full blur-3xl' />
        <div className='absolute bottom-32 left-16 w-48 h-48 bg-[#F2B138]/5 rounded-full blur-2xl' />

        <div className='relative z-10 flex flex-col justify-center px-16 max-w-xl'>
          <h2 className='text-4xl font-extrabold text-white leading-tight mb-5'>
            Welcome to<br />
            <span className='text-[#F2B138]'>Apex Learn</span>
          </h2>
          <p className='text-gray-400 text-lg leading-relaxed mb-10'>
            Your journey to better learning starts here. Set up your account and start exploring courses today.
          </p>
          <div className='space-y-4'>
            {[
              'Access courses across multiple subjects',
              'Track your progress in real-time',
              'Learn at your own pace, anywhere',
            ].map((item, i) => (
              <div key={i} className='flex items-center gap-3'>
                <div className='w-6 h-6 rounded-full bg-[#F2B138]/20 flex items-center justify-center shrink-0'>
                  <svg
                    className='w-3.5 h-3.5 text-[#084A59]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2.5}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <span className='text-base text-gray-300'>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
