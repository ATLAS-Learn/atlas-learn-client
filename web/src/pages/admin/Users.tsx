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

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getUsers({ search: search || undefined, role: roleFilter || undefined, limit, offset: page * limit })
      setUsers(res?.data ?? [])
      setTotal(res?.total ?? 0)
    } catch {
    } finally {
      setLoading(false)
    }
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

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      teacher: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
    }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[role] || 'bg-gray-100 text-gray-600'}`}>{role}</span>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by name or email..."
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138] transition-colors"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F2B138]"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">{total} users found</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 font-semibold text-gray-500">Name</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Email</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Role</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Joined</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#282F2E]">{u.name || '—'}</div>
                      {u.school && <div className="text-xs text-gray-400">{u.school}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">{roleBadge(u.role)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.isActive ? (
                        <button onClick={() => handleDeactivate(u.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleReactivate(u.id)} className="text-xs font-semibold text-green-600 hover:text-green-800 transition-colors">
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
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(total / limit)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * limit >= total}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
