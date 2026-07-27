import { Link, useNavigate } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
      </svg>
    ),
    title: 'Structured Learning',
    desc: 'Subjects organized into chapters with lessons, quizzes, and exam preparation hints.',
  },
  {
    icon: (
      <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' />
      </svg>
    ),
    title: 'Progress Tracking',
    desc: 'Real-time tracking of lesson completion, quiz scores, and overall learning progress.',
  },
  {
    icon: (
      <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
      </svg>
    ),
    title: 'Progressive Unlocking',
    desc: 'Chapters unlock sequentially as students complete previous material, ensuring structured learning.',
  },
  {
    icon: (
      <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
      </svg>
    ),
    title: 'Quizzes & Assessments',
    desc: 'Chapter quizzes and placement assessments with automatic grading and instant feedback.',
  },
  {
    icon: (
      <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
      </svg>
    ),
    title: 'Video Lessons',
    desc: 'Embedded video content for each lesson with progress tracking and bookmarking.',
  },
  {
    icon: (
      <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
      </svg>
    ),
    title: 'Analytics Dashboard',
    desc: 'Platform-wide analytics for student engagement, completion rates, and performance trends.',
  },
];

const roles = [
  {
    icon: (
      <svg className='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
      </svg>
    ),
    title: 'Students',
    desc: 'Access structured lessons, track your progress, take quizzes, and unlock new chapters as you learn.',
    cta: 'Start Learning',
    link: '#download',
  },
  {
    icon: (
      <svg className='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    ),
    title: 'Teachers',
    desc: 'Monitor student progress, manage content, create quizzes, and track class performance.',
    cta: 'Teacher Login',
    link: '/login?role=teacher',
  },
  {
    icon: (
      <svg className='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    ),
    title: 'Admins',
    desc: 'Full platform control: manage users, content, roles, and view comprehensive analytics.',
    cta: 'Admin Login',
    link: '/login?role=admin',
  },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-[#FAFAFA]'>
      {/* Navbar */}
      <nav className='flex items-center justify-between px-6 md:px-12 py-4 bg-white border-b border-gray-100 sticky top-0 z-50'>
        <Link to='/' className='flex items-center gap-2'>
          <img src='/logo.png' alt='Atlas' className='h-9' />
        </Link>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate('/login')}
            className='px-5 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E] transition-colors cursor-pointer'
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className='px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto text-center'>
        <div className='inline-block px-4 py-1.5 bg-[#FFF8E1] rounded-full text-[#F2B138] text-sm font-semibold mb-6'>
          Learning Platform
        </div>
        <h1 className='text-4xl md:text-6xl font-extrabold text-[#1F2524] leading-tight mb-6'>
          Learn Smarter,
          <br />
          Achieve More
        </h1>
        <p className='text-lg text-gray-500 max-w-2xl mx-auto mb-10'>
          A comprehensive learning platform with structured subjects,
          chapter-based progress, quizzes, and real-time analytics for students
          and educators.
        </p>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
          <button
            onClick={() => scrollTo('download')}
            className='px-8 py-3.5 bg-[#1F2524] text-white font-bold rounded-xl hover:bg-[#282F2E] transition-colors shadow-lg cursor-pointer'
          >
            Download App
          </button>
          <button
            onClick={() => navigate('/login')}
            className='px-8 py-3.5 bg-[#F2B138] text-white font-bold rounded-xl hover:bg-[#D49A2E] transition-colors shadow-lg shadow-amber-200 cursor-pointer'
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className='px-6 md:px-12 py-16 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-extrabold text-[#1F2524] mb-4'>
              Everything You Need to Learn
            </h2>
            <p className='text-gray-500 max-w-xl mx-auto'>
              Built for students who want structured, self-paced learning with
              real progress tracking.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((f, i) => (
              <div
                key={i}
                className='p-6 bg-[#FAFAFA] rounded-2xl border border-gray-100 hover:border-[#F2B138] transition-colors group'
              >
                <div className='text-[#F2B138] mb-4 group-hover:scale-110 transition-transform'>
                  {f.icon}
                </div>
                <h3 className='text-lg font-bold text-[#282F2E] mb-2'>
                  {f.title}
                </h3>
                <p className='text-sm text-gray-500 leading-relaxed'>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='px-6 md:px-12 py-16'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-extrabold text-[#1F2524] mb-4'>
              How It Works
            </h2>
            <p className='text-gray-500 max-w-xl mx-auto'>
              Get started in three simple steps.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                step: '01',
                title: 'Download & Sign Up',
                desc: 'Download the app and create your account. Take a placement assessment to set your starting level.',
              },
              {
                step: '02',
                title: 'Learn & Practice',
                desc: 'Work through structured subjects and chapters. Watch video lessons, read content, and take notes.',
              },
              {
                step: '03',
                title: 'Track & Unlock',
                desc: 'Complete quizzes to unlock the next chapter. Track your progress across all subjects in real time.',
              },
            ].map((s, i) => (
              <div key={i} className='text-center'>
                <div className='w-14 h-14 rounded-2xl bg-[#F2B138] text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4'>
                  {s.step}
                </div>
                <h3 className='text-lg font-bold text-[#282F2E] mb-2'>
                  {s.title}
                </h3>
                <p className='text-sm text-gray-500'>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className='px-6 md:px-12 py-16 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-extrabold text-[#1F2524] mb-4'>
              Built for Everyone
            </h2>
            <p className='text-gray-500 max-w-xl mx-auto'>
              Whether you're a student, teacher, or administrator, Atlas Learn
              has you covered.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {roles.map((r, i) => (
              <div
                key={i}
                className='p-8 bg-[#FAFAFA] rounded-2xl border border-gray-100 hover:border-[#F2B138] transition-colors text-center'
              >
                <div className='text-[#F2B138] mb-4 flex justify-center'>
                  {r.icon}
                </div>
                <h3 className='text-lg font-bold text-[#282F2E] mb-2'>
                  {r.title}
                </h3>
                <p className='text-sm text-gray-500 mb-6'>{r.desc}</p>
                <button
                  onClick={() =>
                    r.link.startsWith('#')
                      ? scrollTo(r.link.slice(1))
                      : navigate(r.link)
                  }
                  className='inline-block px-6 py-2.5 bg-[#F2B138] text-white text-sm font-bold rounded-xl hover:bg-[#D49A2E] transition-colors cursor-pointer'
                >
                  {r.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id='download' className='px-6 md:px-12 py-20'>
        <div className='max-w-4xl mx-auto text-center bg-[#1F2524] rounded-3xl px-8 py-16'>
          <h2 className='text-3xl md:text-4xl font-extrabold text-white mb-4'>
            Ready to Start Learning?
          </h2>
          <p className='text-gray-400 max-w-xl mx-auto mb-8'>
            Download Atlas Learn on your phone and begin your learning journey
            today.
          </p>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <button className='flex items-center gap-3 px-6 py-3 bg-white text-[#1F2524] font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer'>
              <svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
              </svg>
              App Store
            </button>
            <button className='flex items-center gap-3 px-6 py-3 bg-white text-[#1F2524] font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer'>
              <svg className='w-6 h-6' viewBox='0 0 24 24'>
                <path fill='#4285F4' d='M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z' />
                <path fill='#34A853' d='M14.5 12.707l2.302 2.302-10.937 6.333 8.635-8.635z' />
                <path fill='#FBBC04' d='M17.699 9.508l2.302 2.302c.812.812.812 2.14 0 2.952l-2.302 2.302L15.396 12l2.302-2.492z' />
                <path fill='#EA4335' d='M5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z' />
              </svg>
              Google Play
            </button>
          </div>
          <div className='mt-8 flex items-center justify-center gap-6'>
            <img src='/logo-white.png' alt='Atlas Learn' className='h-8 opacity-80' />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='px-6 md:px-12 py-8 border-t border-gray-100 bg-white'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <img src='/logo.png' alt='Atlas' className='h-7' />
          <p className='text-sm text-gray-400'>
            Atlas Learn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
