import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'

export default function AdminRoleUpgrades() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const loadPending = useCallback(async () => {
    try {
      const res = await api.getPendingRoleUpgrades()
      setRequests(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])
    } catch {} finally { setLoading(false) }
  }, [])

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return
    try {
      const res = await api.getRoleUpgradeHistory()
      setHistory(Array.isArray(res?.data) ? res.data : [])
      setHistoryLoaded(true)
    } catch {} finally { setHistoryLoading(false) }
  }, [historyLoaded])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPending() }, [loadPending])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'history' && !historyLoaded) loadHistory()
  }, [tab, historyLoaded, loadHistory])

  const handleApprove = async (userId: string) => {
    if (!confirm('Approve this role upgrade to teacher?')) return
    await api.approveRoleUpgrade(userId)
    loadPending()
    setHistoryLoaded(false)
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Reject this role upgrade request?')) return
    await api.rejectRoleUpgrade(userId)
    loadPending()
    setHistoryLoaded(false)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-[#084A59]'>Role Upgrades</h2>
        <p className='text-sm text-gray-400 mt-0.5'>
          {tab === 'pending'
            ? `${requests.length} pending request${requests.length !== 1 ? 's' : ''} from students wanting to become teachers`
            : 'Processed role upgrade requests'}
        </p>
      </div>

      {/* Tabs */}
      <div className='flex gap-2'>
        {(['pending', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-[#084A59] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'pending' ? `Pending (${requests.length})` : 'History'}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === 'pending' && (
        loading ? (
          <div className='flex items-center justify-center h-40 text-gray-400'>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
            <div className='w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <p className='text-lg font-bold text-[#084A59]'>All caught up</p>
            <p className='text-sm text-gray-400 mt-1 max-w-sm mx-auto'>No pending role upgrade requests. New requests from students will appear here.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {requests.map((req: any) => {
              const user = req.user || {}
              const details = req.details || {}
              return (
                <div key={req.requestId || user.id} className='bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'>
                  <div className='p-6'>
                    <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                      <div className='flex items-start gap-4'>
                        <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg flex-shrink-0'>
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className='text-base font-bold text-[#084A59]'>{user.name || 'Unknown'}</h3>
                          <p className='text-sm text-gray-400'>{user.email}</p>
                          <div className='flex items-center gap-2 mt-2'>
                            <span className='inline-flex px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold ring-1 ring-slate-200'>Student</span>
                            <svg className='w-4 h-4 text-gray-300' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' /></svg>
                            <span className='inline-flex px-2.5 py-0.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold ring-1 ring-slate-200'>Teacher</span>
                          </div>
                          {details.reason && (
                            <div className='mt-3 p-3 bg-gray-50 rounded-xl'>
                              <p className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-1'>Reason</p>
                              <p className='text-sm text-gray-600 leading-relaxed'>{details.reason}</p>
                            </div>
                          )}
                          {details.school && (
                            <p className='mt-2 text-sm text-gray-500'>
                              <span className='font-semibold'>School:</span> {details.school}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2 sm:flex-shrink-0'>
                        <button
                          onClick={() => handleApprove(user.id)}
                          className='px-5 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors'
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className='px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200 transition-colors'
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* History Tab */}
      {tab === 'history' && (
        historyLoading ? (
          <div className='flex items-center justify-center h-40 text-gray-400'>Loading history...</div>
        ) : history.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-200 p-16 text-center'>
            <p className='text-sm text-gray-400'>No processed role upgrade requests yet.</p>
          </div>
        ) : (
          <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='bg-gray-50/80 border-b border-gray-100'>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>User</th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Action</th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Reason</th>
                    <th className='text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Date</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {history.map((h: any) => (
                    <tr key={h.id} className='hover:bg-gray-50/50 transition-colors'>
                      <td className='px-6 py-3.5'>
                        <div>
                          <p className='text-sm font-semibold text-[#084A59]'>{h.user?.name || 'Unknown'}</p>
                          <p className='text-xs text-gray-400'>{h.user?.email}</p>
                        </div>
                      </td>
                      <td className='px-6 py-3.5'>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                          h.action === 'approved' ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {h.action === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </td>
                      <td className='px-6 py-3.5 text-sm text-gray-500 max-w-xs truncate'>{h.details?.reason || '—'}</td>
                      <td className='px-6 py-3.5 text-sm text-gray-500'>
                        {new Date(h.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
