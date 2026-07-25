import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'

export default function AdminRoleUpgrades() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getPendingRoleUpgrades()
      setRequests(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (userId: string) => {
    if (!confirm('Approve this role upgrade to teacher?')) return
    await api.approveRoleUpgrade(userId)
    load()
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Reject this role upgrade request?')) return
    await api.rejectRoleUpgrade(userId)
    load()
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{requests.length} pending request{requests.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="mb-3">
            <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-gray-500 font-semibold">No pending role upgrade requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const user = req.user || {}
            const details = req.details || {}
            return (
              <div key={req.requestId || user.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#282F2E]">{user.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Student</span>
                      <span className="text-gray-400">→</span>
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">Teacher</span>
                    </div>
                    {details.reason && (
                      <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                        <span className="font-semibold">Reason:</span> {details.reason}
                      </p>
                    )}
                    {details.school && (
                      <p className="mt-1 text-sm text-gray-500">
                        <span className="font-semibold">School:</span> {details.school}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
