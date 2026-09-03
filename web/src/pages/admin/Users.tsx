import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('teacher')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [showInvites, setShowInvites] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const isSuperadmin = currentUser?.role === 'superadmin'

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getUsers({ search: search || undefined, role: roleFilter || undefined, limit, offset: page * limit })
      setUsers(res?.data ?? [])
      setTotal(res?.total ?? 0)
    } catch {} finally { setLoading(false) }
  }, [search, roleFilter, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return
    await api.deactivateUser(userId)
    loadUsers()
  }

  const handleReactivate = async (userId: string) => {
    await api.reactivateUser(userId)
    loadUsers()
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteLoading(true)
    try {
      await api.adminCreateUser({ email: inviteEmail, role: inviteRole })
      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteModal(false)
      loadPendingInvites()
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite')
    } finally {
      setInviteLoading(false)
    }
  }

  const loadPendingInvites = async () => {
    try {
      const res = await api.getPendingInvites()
      setPendingInvites(res?.data ?? [])
    } catch {}
  }

  const handleResendInvite = async (userId: string) => {
    await api.resendInvite(userId)
    loadPendingInvites()
  }

  const handleCancelInvite = async (userId: string, email: string) => {
    if (!confirm(`Cancel invite for ${email}? This will delete the pending invitation.`)) return
    try {
      await api.cancelInvite(userId)
      loadPendingInvites()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invite')
    }
  }

  useEffect(() => { loadPendingInvites() }, [])

  useEffect(() => {
    api.getCurrentUser().then(res => setCurrentUser(res?.data ?? res)).catch(() => {})
  }, [])

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      superadmin: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      admin: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      teacher: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
      student: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
    }
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold capitalize ${styles[role] || 'bg-gray-50 text-gray-600'}`}>
        {role}
      </span>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header Row */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-[#084A59]'>Users</h2>
          <p className='text-sm text-gray-400 mt-0.5'>{total} registered user{total !== 1 ? 's' : ''}</p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => { setShowInvites(!showInvites); loadPendingInvites() }}
            className='px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors'
          >
            Invites {pendingInvites.length > 0 && <span className='ml-1.5 px-1.5 py-0.5 bg-[#084A59] text-white text-xs rounded-md font-bold'>{pendingInvites.length}</span>}
          </button>
          <button
            onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteSuccess('') }}
            className='px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#084A59] text-white hover:bg-[#011C26] transition-colors'
          >
            + Invite User
          </button>
        </div>
      </div>

      {/* Pending Invites Panel */}
      {showInvites && (
        <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
            <h3 className='font-bold text-[#084A59]'>Pending Invites</h3>
            <button onClick={() => setShowInvites(false)} className='text-gray-400 hover:text-gray-600'>
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
            </button>
          </div>
          {pendingInvites.length === 0 ? (
            <div className='px-6 py-8 text-center'>
              <p className='text-sm text-gray-400'>No pending invites</p>
            </div>
          ) : (
            <div className='divide-y divide-gray-50'>
              {pendingInvites.map((inv) => (
                <div key={inv.user.id} className='px-6 py-3 flex items-center justify-between hover:bg-gray-50/50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500'>
                      {(inv.user.name || inv.user.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-[#084A59]'>{inv.user.name || 'Unnamed'}</p>
                      <p className='text-xs text-gray-400'>{inv.user.email}</p>
                    </div>
                    <span className='px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-500 uppercase'>{inv.user.role}</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-xs text-gray-400'>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                    <button onClick={() => handleResendInvite(inv.user.id)} className='text-xs font-semibold text-[#084A59] hover:text-[#011C26] transition-colors'>
                      Resend
                    </button>
                    <button onClick={() => handleCancelInvite(inv.user.id, inv.user.email)} className='text-xs font-semibold text-red-400 hover:text-red-600 transition-colors'>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative flex-1 min-w-[240px]'>
          <svg className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
          </svg>
          <input
            type='text'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder='Search users...'
            className='w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
          />
        </div>
        <div className='flex items-center gap-2'>
          {['', 'student', 'teacher', 'admin', 'superadmin'].map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(0) }}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                roleFilter === role
                  ? 'bg-[#084A59] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {role === '' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-50/80 border-b border-gray-100'>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>User</th>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Role</th>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Joined</th>
                <th className='text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr><td colSpan={5} className='px-6 py-12 text-center text-gray-400'>Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className='px-6 py-12 text-center text-gray-400'>No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className='hover:bg-gray-50/50 transition-colors'>
                    <td className='px-6 py-3.5'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-full bg-[#084A59] flex items-center justify-center text-xs font-bold text-white flex-shrink-0'>
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-[#084A59]'>{u.name || 'Unnamed'}</p>
                          <p className='text-xs text-gray-400'>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-3.5'>{roleBadge(u.role)}</td>
                    <td className='px-6 py-3.5'>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? 'text-slate-600' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-slate-400' : 'bg-gray-300'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-3.5 text-sm text-gray-500'>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className='px-6 py-3.5 text-right'>
                      {u.isActive ? (
                        <button onClick={() => handleDeactivate(u.id)} className='text-xs font-semibold text-slate-400 hover:text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors'>
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleReactivate(u.id)} className='text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors'>
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-gray-400'>
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className='px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              Previous
            </button>
            <span className='text-sm text-gray-500 font-medium px-2'>
              Page {page + 1} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className='px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4' onClick={() => setShowInviteModal(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl' onClick={(e) => e.stopPropagation()}>
            <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-bold text-[#084A59]'>Invite a User</h3>
                <p className='text-sm text-gray-400 mt-0.5'>Send an email invitation to join Apex Learn</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <div className='px-6 py-5'>
              {inviteError && (
                <div className='bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium'>{inviteError}</div>
              )}
              {inviteSuccess && (
                <div className='bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium'>{inviteSuccess}</div>
              )}
              <form onSubmit={handleInvite} className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Email Address</label>
                  <input
                    type='email'
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B138]/20 focus:border-[#F2B138] transition-all'
                    placeholder='jane@example.com'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Role</label>
                  <div className={`grid gap-3 ${isSuperadmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <button
                      type='button'
                      onClick={() => setInviteRole('teacher')}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        inviteRole === 'teacher'
                          ? 'border-slate-500 bg-slate-50 text-slate-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <svg className='w-5 h-5 mx-auto mb-1' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342' />
                      </svg>
                      Teacher
                    </button>
                    <button
                      type='button'
                      onClick={() => setInviteRole('admin')}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        inviteRole === 'admin'
                          ? 'border-[#084A59] bg-slate-50 text-[#084A59]'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <svg className='w-5 h-5 mx-auto mb-1' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' />
                      </svg>
                      Admin
                    </button>
                    {isSuperadmin && (
                      <button
                        type='button'
                        onClick={() => setInviteRole('superadmin')}
                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          inviteRole === 'superadmin'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <svg className='w-5 h-5 mx-auto mb-1' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' />
                        </svg>
                        Superadmin
                      </button>
                    )}
                  </div>
                </div>
                <div className='flex gap-3 pt-2'>
                  <button type='button' onClick={() => setShowInviteModal(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'>
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={inviteLoading}
                    className='flex-1 py-2.5 bg-[#084A59] text-white font-semibold rounded-xl hover:bg-[#011C26] transition-colors disabled:opacity-50 text-sm'
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
