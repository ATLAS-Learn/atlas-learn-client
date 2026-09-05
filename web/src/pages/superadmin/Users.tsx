import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const ROLES = ['student', 'teacher', 'admin', 'superadmin'];

const roleStyles: Record<string, string> = {
  student: 'bg-[#12A67C]/10 text-[#12A67C]',
  teacher: 'bg-[#084A59]/10 text-[#084A59]',
  admin: 'bg-[#F2B138]/10 text-[#9A7B17]',
  superadmin: 'bg-[#BF522A]/10 text-[#BF522A]',
};

export default function SuperadminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [roleModal, setRoleModal] = useState<{ open: boolean; userId: string; currentRole: string }>({ open: false, userId: '', currentRole: '' });

  const loadUsers = async (reset = false) => {
    try {
      setLoading(true);
      const params: any = { limit: 30, offset: reset ? 0 : (page - 1) * 30 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await api.getSuperadminUsers(params);
      const data = res.data || res.users || [];
      setUsers(reset ? data : [...users, ...data]);
      setTotal(res.total || 0);
      setHasMore(res.pagination?.hasMore ?? (res.total || 0) > (reset ? 0 : users.length) + data.length);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(true);
    setPage(1);
  }, [search, roleFilter]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.adminCreateUser({ email: inviteEmail.trim(), role: inviteRole });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('teacher');
    } catch (e: any) {
      alert(e?.response?.data?.error || e.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!roleModal.userId || newRole === roleModal.currentRole) {
      setRoleModal({ open: false, userId: '', currentRole: '' });
      return;
    }
    setChangingRole(roleModal.userId);
    try {
      await api.changeUserRole(roleModal.userId, newRole);
      setUsers(users.map((u) => u.id === roleModal.userId ? { ...u, role: newRole } : u));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to change role');
    } finally {
      setChangingRole(null);
      setRoleModal({ open: false, userId: '', currentRole: '' });
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.superadminDeactivateUser(userId);
      setUsers(users.map((u) => u.id === userId ? { ...u, isActive: false } : u));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to deactivate');
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      await api.superadminReactivateUser(userId);
      setUsers(users.map((u) => u.id === userId ? { ...u, isActive: true } : u));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to reactivate');
    }
  };

  const handleLoadMore = () => {
    setPage(page + 1);
    loadUsers(false);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h2 className='text-2xl font-bold text-[#011C26]'>Users</h2>
          <p className='text-sm text-gray-500 mt-1'>{total} total users</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className='bg-[#084A59] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#063945] transition-colors'
        >
          + Invite User
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-wrap gap-3'>
        <input
          type='text'
          placeholder='Search by name, email, or username...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59]'
        />
        <div className='flex gap-1'>
          <button
            onClick={() => setRoleFilter('')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!roleFilter ? 'bg-[#084A59] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${roleFilter === r ? 'bg-[#084A59] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100'>
                <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>User</th>
                <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Role</th>
                <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>School</th>
                <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Status</th>
                <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Joined</th>
                <th className='text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-6 py-12 text-center text-gray-400'>Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-6 py-12 text-center text-gray-400'>No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        {u.image ? (
                          <img src={u.image} alt='' className='w-9 h-9 rounded-full object-cover' />
                        ) : (
                          <div className='w-9 h-9 rounded-full bg-[#084A59] text-white text-sm flex items-center justify-center font-bold'>
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className='text-sm font-semibold text-[#011C26]'>{u.name || 'No name'}</p>
                          <p className='text-xs text-gray-500'>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() => setRoleModal({ open: true, userId: u.id, currentRole: u.role })}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize cursor-pointer hover:opacity-80 transition-opacity ${roleStyles[u.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {u.role}
                      </button>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-700'>{u.school || '—'}</span>
                    </td>
                    <td className='px-6 py-4'>
                      {u.isActive ? (
                        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#12A67C]/10 text-[#12A67C]'>
                          <span className='w-1.5 h-1.5 rounded-full bg-[#12A67C]' />
                          Active
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600'>
                          <span className='w-1.5 h-1.5 rounded-full bg-red-500' />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-500'>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {u.isActive ? (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className='px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(u.id)}
                            className='px-3 py-1.5 text-xs font-medium text-[#12A67C] hover:bg-[#12A67C]/10 rounded-lg transition-colors'
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className='px-6 py-4 border-t border-gray-100'>
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className='w-full py-2 text-sm font-medium text-[#084A59] hover:bg-[#084A59]/5 rounded-lg transition-colors disabled:opacity-50'
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-[#011C26] mb-4'>Invite User</h3>
              <input
                type='email'
                placeholder='Email address'
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59] mb-4'
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59] mb-4'
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className='flex justify-end gap-3 px-6 pb-6'>
              <button
                onClick={() => { setInviteOpen(false); setInviteEmail(''); }}
                className='px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className='px-5 py-2 bg-[#084A59] text-white text-sm font-medium rounded-lg hover:bg-[#063945] disabled:opacity-50 transition-colors'
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleModal.open && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setRoleModal({ open: false, userId: '', currentRole: '' })}>
          <div className='bg-white rounded-2xl w-full max-w-sm shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-[#011C26] mb-1'>Change Role</h3>
              <p className='text-sm text-gray-500 mb-4'>Current: <span className='font-medium capitalize'>{roleModal.currentRole}</span></p>
              <div className='space-y-2'>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    disabled={r === roleModal.currentRole || !!changingRole}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all ${
                      r === roleModal.currentRole
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 text-[#011C26] hover:bg-[#084A59]/10 hover:text-[#084A59]'
                    }`}
                  >
                    {r === roleModal.currentRole ? `${r} (current)` : r}
                  </button>
                ))}
              </div>
            </div>
            <div className='px-6 pb-6'>
              <button
                onClick={() => setRoleModal({ open: false, userId: '', currentRole: '' })}
                className='w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
