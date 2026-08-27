import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'admin';
  const [role, setRole] = useState<'admin' | 'teacher'>(
    initialRole === 'teacher' ? 'teacher' : 'admin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      const user = res?.user;
      if (!user) {
        setError('Login failed. Please try again.');
        return;
      }
      const userRole = user.role;
      if (role === 'admin' && userRole !== 'admin') {
        setError('Access denied. Admin accounts only.');
        api.clearUser();
        return;
      }
      if (
        role === 'teacher' &&
        userRole !== 'teacher' &&
        userRole !== 'admin'
      ) {
        setError('Access denied. Teacher or admin accounts only.');
        api.clearUser();
        return;
      }
      navigate(userRole === 'admin' ? '/admin' : '/teacher');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex'>
      {/* Left: Login Form */}
      <div className='w-full lg:w-1/2 flex flex-col justify-center px-10 md:px-16 bg-white'>
        <div className='w-full max-w-md mx-auto'>
          <div className='flex justify-center mb-10'>
            <img src='/logo-console.png' alt='Apex Learn' className='h-24' />
          </div>

          <h1 className='text-3xl font-bold text-[#084A59] mb-2'>
            {role === 'admin' ? 'Admin Portal' : 'Teacher Portal'}
          </h1>
          <p className='text-base text-gray-500 mb-8'>
            Sign in to manage your dashboard
          </p>

          {/* Role Tabs */}
          <div className='flex gap-1 mb-6 bg-gray-100 rounded-lg p-1'>
            {(['admin', 'teacher'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-md text-base font-medium transition-colors ${role === r ? 'bg-white text-[#084A59] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r === 'admin' ? 'Admin' : 'Teacher'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-500'>
                {error}
              </div>
            )}

            <div className='mb-5'>
              <label className='block text-sm font-medium text-gray-600 mb-2'>
                Email
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                placeholder='you@example.com'
              />
            </div>

            <div className='mb-7'>
              <label className='block text-sm font-medium text-gray-600 mb-2'>
                Password
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#084A59] focus:ring-1 focus:ring-[#084A59]/10 transition-all'
                placeholder='••••••••'
              />
              <div className='text-right mt-2'>
                <a
                  href='/forgot-password'
                  style={{ textDecoration: 'none' }}
                  className='text-sm text-[#084A59] hover:text-[#011C26] transition-colors'
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full py-3.5 bg-[#084A59] text-white font-semibold rounded-lg hover:bg-[#011C26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Branding Panel */}
      <div className='hidden lg:flex w-1/2 bg-[#084A59] relative overflow-hidden flex-col justify-center items-start'>
        {/* Decorative circles */}
        <div className='absolute top-20 right-20 w-72 h-72 bg-[#F2B138]/10 rounded-full blur-3xl' />
        <div className='absolute bottom-32 left-16 w-48 h-48 bg-[#F2B138]/5 rounded-full blur-2xl' />

        <div className='relative z-10 flex flex-col justify-center px-16 max-w-xl'>
          <h2 className='text-4xl font-extrabold text-white leading-tight mb-5'>
            Manage learning
            <br />
            <span className='text-[#F2B138]'>that actually works.</span>
          </h2>

          <p className='text-gray-400 text-lg leading-relaxed mb-10'>
            Track student progress across subjects, create quizzes, and unlock
            insights — all from one dashboard built for educators who care about
            results.
          </p>

          <div className='space-y-4'>
            {[
              'Real-time student progress tracking',
              'Quiz creation and performance analytics',
              'Content management across all subjects',
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
