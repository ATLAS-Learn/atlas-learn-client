import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
      </svg>
    ),
    title: 'Structured Subjects',
    desc: 'Well-organized chapters and lessons that build on each other.',
  },
  {
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' />
      </svg>
    ),
    title: 'Real Progress Tracking',
    desc: 'See exactly where you stand with completion rates and scores.',
  },
  {
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
      </svg>
    ),
    title: 'Smart Unlocking',
    desc: 'Master each chapter before moving on to the next.',
  },
  {
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
      </svg>
    ),
    title: 'Instant Feedback',
    desc: 'Get quiz results immediately with detailed explanations.',
  },
  {
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
      </svg>
    ),
    title: 'Video Lessons',
    desc: 'Watch engaging video content and track your watch time.',
  },
  {
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
      </svg>
    ),
    title: 'Learning Streaks',
    desc: 'Build daily habits and stay motivated to learn every day.',
  },
];

const stats = [
  { value: '5', label: 'Subjects' },
  { value: '44', label: 'Chapters' },
  { value: '130+', label: 'Lessons' },
  { value: '160+', label: 'Questions' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  return (
    <div className='min-h-screen bg-[#011C26] overflow-x-hidden'>
      {/* Navbar */}
      <nav className='flex items-center justify-between px-6 md:px-12 py-4 sticky top-0 z-50 bg-[#011C26]/80 backdrop-blur-xl border-b border-white/5'>
        <Link to='/' style={{ textDecoration: 'none' }} className='flex items-center gap-2'>
          <img src='/logo-landing.png' alt='Apex Learn' className='h-9' />
        </Link>
        <button
          onClick={() => scrollTo('download')}
          className='px-5 py-2 text-sm font-semibold text-[#011C26] bg-[#F2B138] rounded-full hover:bg-[#e5a232] transition-all duration-300 hover:shadow-[0_0_20px_rgba(242,177,56,0.3)] cursor-pointer'
        >
          Get the App
        </button>
      </nav>

      {/* Hero */}
      <section className='relative px-6 md:px-12 pt-20 pb-28 md:pt-32 md:pb-40 max-w-6xl mx-auto text-center'>
        {/* Glow effects */}
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#084A59]/30 rounded-full blur-[120px] pointer-events-none' />
        <div className='absolute top-20 right-10 w-72 h-72 bg-[#F2B138]/10 rounded-full blur-[100px] pointer-events-none' />

        <div className='relative z-10'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm'>
            <span className='w-1.5 h-1.5 rounded-full bg-[#12A67C] animate-pulse' />
            Built for GCE A Level Students in Cameroon
          </div>

          <h1 className='text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight'>
            Study Smarter.
            <br />
            <span className='bg-gradient-to-r from-[#F2B138] via-[#e5a232] to-[#F2B138] bg-clip-text text-transparent'>
              Score Higher.
            </span>
          </h1>

          <p className='text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 leading-relaxed'>
            Structured lessons, chapter quizzes, and a personalized learning
            path — everything you need to ace your exams.
          </p>

          <button
            onClick={() => scrollTo('download')}
            className='px-8 py-4 bg-[#084A59] text-white font-semibold rounded-full hover:bg-[#12A67C] transition-all duration-300 shadow-[0_0_30px_rgba(8,74,89,0.4)] hover:shadow-[0_0_40px_rgba(18,166,124,0.4)] cursor-pointer'
          >
            Download for Free
          </button>

          {/* Stats */}
          <div className='mt-20 flex items-center justify-center gap-8 md:gap-16'>
            {stats.map((s, i) => (
              <div key={i} className='text-center group'>
                <p className='text-2xl md:text-3xl font-extrabold text-[#F2B138] group-hover:scale-110 transition-transform duration-300'>
                  {s.value}
                </p>
                <p className='text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider'>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='relative px-6 md:px-12 py-24 bg-[#084A59]'>
        <div className='absolute inset-0 bg-gradient-to-b from-[#011C26] to-transparent opacity-50 pointer-events-none' />
        <div className='max-w-6xl mx-auto relative z-10'>
          <div className='text-center mb-16'>
            <p className='text-xs font-semibold tracking-widest text-[#F2B138] uppercase mb-4'>
              Features
            </p>
            <h2 className='text-3xl md:text-5xl font-extrabold text-white leading-tight'>
              Everything you need,
              <br className='hidden md:block' /> nothing you don't.
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {features.map((f, i) => (
              <div
                key={i}
                className='p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-[#F2B138]/30 hover:bg-white/8 transition-all duration-300 group cursor-default'
              >
                <div className='w-10 h-10 rounded-xl bg-[#F2B138]/10 flex items-center justify-center text-[#F2B138] mb-4 group-hover:bg-[#F2B138]/20 group-hover:scale-110 transition-all duration-300'>
                  {f.icon}
                </div>
                <h3 className='text-sm font-bold text-white mb-1.5'>
                  {f.title}
                </h3>
                <p className='text-xs text-gray-400 leading-relaxed'>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='px-6 md:px-12 py-24 bg-[#011C26]'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-16'>
            <p className='text-xs font-semibold tracking-widest text-[#F2B138] uppercase mb-4'>
              How it works
            </p>
            <h2 className='text-3xl md:text-5xl font-extrabold text-white'>
              Start learning in 3 steps
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {[
              {
                step: '01',
                title: 'Sign Up & Assess',
                desc: 'Create your account and take a quick placement test.',
              },
              {
                step: '02',
                title: 'Learn at Your Pace',
                desc: 'Follow your personalized path through subjects and lessons.',
              },
              {
                step: '03',
                title: 'Quiz & Unlock',
                desc: 'Pass chapter quizzes to unlock the next topic.',
              },
            ].map((s, i) => (
              <div key={i} className='relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-[#084A59]/50 transition-all duration-300 group'>
                <div className='text-5xl font-extrabold text-[#F2B138]/80 mb-4 group-hover:text-[#F2B138] transition-all duration-300'>
                  {s.step}
                </div>
                <h3 className='text-base font-bold text-white mb-2'>
                  {s.title}
                </h3>
                <p className='text-sm text-gray-400 leading-relaxed'>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id='download' className='relative px-6 md:px-12 py-24 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#084A59] via-[#084A59] to-[#011C26]' />
        <div className='absolute top-0 right-0 w-96 h-96 bg-[#F2B138]/10 rounded-full blur-[120px] pointer-events-none' />
        <div className='absolute bottom-0 left-0 w-72 h-72 bg-[#12A67C]/10 rounded-full blur-[100px] pointer-events-none' />

        <div className='relative z-10 max-w-3xl mx-auto text-center'>
          <h2 className='text-3xl md:text-5xl font-extrabold text-white mb-4'>
            Ready to start?
          </h2>
          <p className='text-gray-300 max-w-md mx-auto mb-12 text-lg'>
            Download Apex Learn on your phone and begin your learning journey
            today.
          </p>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <button className='flex items-center gap-3 px-7 py-4 bg-black/50 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-black/70 transition-all duration-300 border border-white/10 hover:border-white/20 cursor-pointer'>
              <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
              </svg>
              App Store
            </button>
            <button className='flex items-center gap-3 px-7 py-4 bg-[#12A67C]/80 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-[#12A67C] transition-all duration-300 shadow-[0_0_20px_rgba(18,166,124,0.3)] hover:shadow-[0_0_30px_rgba(18,166,124,0.5)] cursor-pointer'>
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
      <footer className='px-6 md:px-12 pt-16 pb-8 bg-[#011C26] border-t border-white/5'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-10 mb-12'>
            {/* Brand */}
            <div className='md:col-span-1'>
              <img src='/logo-landing.png' alt='Apex Learn' className='h-8 mb-4' />
              <p className='text-sm text-gray-500 leading-relaxed'>
                Structured learning for GCE A Level students in Cameroon.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className='text-sm font-bold text-white mb-4 uppercase tracking-wider'>Product</h4>
              <ul className='space-y-2.5'>
                <li><a href='#download' className='text-sm text-gray-400 hover:text-[#F2B138] transition-colors'>Download App</a></li>
                <li><span className='text-sm text-gray-400'>Features</span></li>
                <li><span className='text-sm text-gray-400'>Pricing</span></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className='text-sm font-bold text-white mb-4 uppercase tracking-wider'>Support</h4>
              <ul className='space-y-2.5'>
                <li><a href='mailto:support@apexlearn.app' className='text-sm text-gray-400 hover:text-[#F2B138] transition-colors'>support@apexlearn.app</a></li>
                <li><span className='text-sm text-gray-400'>Help Center</span></li>
                <li><span className='text-sm text-gray-400'>Report a Bug</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className='text-sm font-bold text-white mb-4 uppercase tracking-wider'>Legal</h4>
              <ul className='space-y-2.5'>
                <li><span className='text-sm text-gray-400'>Privacy Policy</span></li>
                <li><span className='text-sm text-gray-400'>Terms of Service</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className='border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4'>
            <p className='text-xs text-gray-500'>
              &copy; {new Date().getFullYear()} Apex Learn. All rights reserved.
            </p>
            <div className='flex items-center gap-4'>
              <a href='mailto:support@apexlearn.app' className='text-gray-500 hover:text-[#F2B138] transition-colors'>
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
              </a>
              <a href='https://twitter.com/apexlearn' target='_blank' rel='noreferrer' className='text-gray-500 hover:text-[#F2B138] transition-colors'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                </svg>
              </a>
              <a href='https://wa.me/237000000000' target='_blank' rel='noreferrer' className='text-gray-500 hover:text-[#F2B138] transition-colors'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
