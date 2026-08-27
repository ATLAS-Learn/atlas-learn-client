import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
        />
      </svg>
    ),
    title: 'Structured Subjects',
    desc: 'Well-organized chapters and lessons that build on each other, so you never feel lost.',
  },
  {
    icon: (
      <svg
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
        />
      </svg>
    ),
    title: 'Real Progress Tracking',
    desc: 'See exactly where you stand with completion rates, quiz scores, and time spent.',
  },
  {
    icon: (
      <svg
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
        />
      </svg>
    ),
    title: 'Smart Unlocking',
    desc: 'Master each chapter before moving on. Quizzes unlock the next step in your journey.',
  },
  {
    icon: (
      <svg
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        />
      </svg>
    ),
    title: 'Instant Feedback',
    desc: 'Get your quiz results immediately with detailed explanations for every question.',
  },
  {
    icon: (
      <svg
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
        />
      </svg>
    ),
    title: 'Video Lessons',
    desc: 'Watch engaging video content for each topic, track your watch time, and pick up where you left off.',
  },
  {
    icon: (
      <svg
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
    ),
    title: 'Your Learning Streak',
    desc: 'Build daily habits. Track your streak and stay motivated to learn every day.',
  },
];

const stats = [
  { value: '5', label: 'Subjects' },
  { value: '44', label: 'Chapters' },
  { value: '130+', label: 'Lessons' },
  { value: '160+', label: 'Quiz Questions' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Navbar */}
      <nav className='flex items-center justify-between px-6 md:px-12 py-5 bg-[#084A59] sticky top-0 z-50'>
        <Link
          to='/'
          style={{ textDecoration: 'none' }}
          className='flex items-center gap-2.5'
        >
          <img src='/logo-console.png' alt='Apex Learn' className='h-20' />
        </Link>
        <button
          onClick={() => scrollTo('download')}
          className='px-5 py-2 text-sm font-semibold text-[#084A59] bg-[#F2B138] rounded-full hover:bg-[#e5a232] transition-colors cursor-pointer'
        >
          Get the App
        </button>
      </nav>

      {/* Hero */}
      <section className='px-6 md:px-12 pt-20 pb-24 md:pt-32 md:pb-36 max-w-5xl mx-auto text-center'>
        <div className='inline-flex items-center gap-2 px-4 py-1.5 bg-[#084A59]/5 border border-[#084A59]/10 rounded-full text-xs font-medium text-[#084A59] mb-8'>
          <span className='w-1.5 h-1.5 rounded-full bg-[#F2B138] animate-pulse'></span>
          Built for GCE A Level Students in Cameroon
        </div>
        <h1 className='text-5xl md:text-7xl font-extrabold text-[#011C26] leading-[1.05] mb-6 tracking-tight'>
          Study Smarter.
          <br />
          <span className='text-[#F2B138]'>Score Higher.</span>
        </h1>
        <p className='text-lg md:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed'>
          Structured lessons, chapter quizzes, and a personalized learning path
          — everything you need to ace your exams.
        </p>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
          <button
            onClick={() => scrollTo('download')}
            className='px-8 py-3.5 bg-[#084A59] text-white font-semibold rounded-full hover:bg-[#011C26] transition-all shadow-lg shadow-gray-200/80 cursor-pointer'
          >
            Download Mobile App for Free
          </button>
        </div>

        {/* Stats strip */}
        <div className='mt-16 flex items-center justify-center gap-8 md:gap-16'>
          {stats.map((s, i) => (
            <div key={i} className='text-center'>
              <p className='text-2xl md:text-3xl font-extrabold text-[#084A59]'>
                {s.value}
              </p>
              <p className='text-xs text-gray-500 font-medium mt-1'>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className='px-6 md:px-12 py-20 bg-[#011C26]'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-14'>
            <p className='text-xs font-semibold tracking-widest text-[#F2B138] uppercase mb-3'>
              Features
            </p>
            <h2 className='text-3xl md:text-4xl font-extrabold text-white'>
              Everything you need,
              <br className='hidden md:block' /> nothing you don't.
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {features.map((f, i) => (
              <div
                key={i}
                className='p-6 bg-[#084A59] rounded-2xl border border-[#084A59] hover:border-[#F2B138]/30 hover:shadow-lg transition-all duration-200 group'
              >
                <div className='w-10 h-10 rounded-xl bg-[#F2B138]/15 flex items-center justify-center text-[#F2B138] mb-4 group-hover:bg-[#F2B138]/25 transition-colors'>
                  {f.icon}
                </div>
                <h3 className='text-base font-bold text-white mb-1.5'>
                  {f.title}
                </h3>
                <p className='text-sm text-gray-400 leading-relaxed'>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='px-6 md:px-12 py-20 bg-white'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-14'>
            <p className='text-xs font-semibold tracking-widest text-[#F2B138] uppercase mb-3'>
              How it works
            </p>
            <h2 className='text-3xl md:text-4xl font-extrabold text-[#084A59]'>
              Start learning in 3 steps
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                step: '01',
                title: 'Sign Up & Assess',
                desc: 'Create your account and take a quick placement test so we know your level.',
              },
              {
                step: '02',
                title: 'Learn at Your Pace',
                desc: 'Follow your personalized path through subjects, chapters, and video lessons.',
              },
              {
                step: '03',
                title: 'Quiz & Unlock',
                desc: 'Pass chapter quizzes to unlock the next topic and track your improvement.',
              },
            ].map((s, i) => (
              <div key={i} className='relative'>
                <div className='text-5xl font-extrabold text-[#084A59] mb-3'>
                  {s.step}
                </div>
                <h3 className='text-lg font-bold text-[#084A59] mb-2'>
                  {s.title}
                </h3>
                <p className='text-sm text-gray-500 leading-relaxed'>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id='download' className='px-6 md:px-12 py-20 bg-[#F2B138]'>
        <div className='max-w-3xl mx-auto text-center'>
          <h2 className='text-3xl md:text-4xl font-extrabold text-[#011C26] mb-4'>
            Ready to start?
          </h2>
          <p className='text-[#011C26]/70 max-w-md mx-auto mb-10'>
            Download Apex Learn on your phone and begin your learning journey
            today.
          </p>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <button className='flex items-center gap-3 px-7 py-3.5 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all shadow-lg cursor-pointer'>
              <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
              </svg>
              App Store
            </button>
            <button className='flex items-center gap-3 px-7 py-3.5 bg-[#01875f] text-white font-semibold rounded-full hover:bg-[#016c4b] transition-all shadow-lg cursor-pointer'>
              <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z' />
                <path d='M14.5 12.707l2.302 2.302-10.937 6.333 8.635-8.635z' />
                <path d='M17.699 9.508l2.302 2.302c.812.812.812 2.14 0 2.952l-2.302 2.302L15.396 12l2.302-2.492z' />
                <path d='M5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z' />
              </svg>
              Google Play
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='px-6 md:px-12 py-8 bg-[#011C26]'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <img src='/logo-console.png' alt='Apex Learn' className='h-15' />
          <p className='text-xs text-gray-400'>
            &copy; {new Date().getFullYear()} Apex Learn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
