import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const nav = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </svg>
    ),
  },
  {
    to: '/admin/subjects',
    label: 'Subjects',
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
        />
      </svg>
    ),
  },
  {
    to: '/admin/role-upgrades',
    label: 'Role Upgrades',
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
        />
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    api.clearToken();
    navigate('/login');
  };

  return (
    <div className='min-h-screen bg-[#FAFAFA] flex'>
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-[#1F2524] text-white flex flex-col transition-transform lg:translate-x-0 lg:static`}
      >
        <div className='px-6 py-5 flex items-center gap-3 border-b border-white/10'>
          <img src='/icon.png' alt='Atlas' className='w-8 h-8 rounded-lg' />
          <span className='font-bold text-lg'>Atlas Admin</span>
        </div>

        <nav className='flex-1 px-3 py-4 space-y-1'>
          {nav.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== '/admin' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#F2B138] text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className='text-lg'>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className='px-3 py-4 border-t border-white/10'>
          <button
            onClick={handleLogout}
            className='w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/40 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Top bar */}
        <header className='sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='lg:hidden p-2 rounded-lg hover:bg-gray-100'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          </button>
          <h1 className='text-lg font-bold text-[#282F2E]'>
            {nav.find(
              (n) =>
                location.pathname === n.to ||
                (n.to !== '/admin' && location.pathname.startsWith(n.to)),
            )?.label || 'Admin'}
          </h1>
        </header>

        <main className='flex-1 p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
