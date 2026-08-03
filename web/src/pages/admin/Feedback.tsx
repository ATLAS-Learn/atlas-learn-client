import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'

const CATEGORIES = ['all', 'bug', 'feature_request', 'general', 'complaint', 'suggestion'] as const
const STATUSES = ['all', 'pending', 'reviewed', 'resolved'] as const

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  general: 'General',
  complaint: 'Complaint',
  suggestion: 'Suggestion',
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-50 text-red-600 ring-red-200',
  feature_request: 'bg-blue-50 text-blue-600 ring-blue-200',
  general: 'bg-gray-100 text-gray-500 ring-gray-200',
  complaint: 'bg-orange-50 text-orange-600 ring-orange-200',
  suggestion: 'bg-green-50 text-green-600 ring-green-200',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 ring-amber-200',
  reviewed: 'bg-blue-50 text-blue-600 ring-blue-200',
  resolved: 'bg-green-50 text-green-600 ring-green-200',
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  reviewed: 'bg-blue-400',
  resolved: 'bg-green-400',
}

export default function AdminFeedback() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const limit = 20

  // Reply modal
  const [replyModal, setReplyModal] = useState<{ open: boolean; feedback: any | null }>({ open: false, feedback: null })
  const [replyText, setReplyText] = useState('')

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-feedback', categoryFilter, statusFilter, page],
    queryFn: async () => {
      const params: any = { page: page + 1, limit }
      if (categoryFilter !== 'all') params.category = categoryFilter
      if (statusFilter !== 'all') params.status = statusFilter
      return api.getAllFeedback(params)
    },
    staleTime: 60_000,
    gcTime: 300_000,
  })

  const feedbacks = data?.data ?? []
  const totalPages = data?.pagination?.totalPages ?? 1
  const total = data?.pagination?.total ?? 0

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; adminReply?: string } }) =>
      api.updateFeedback(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
    },
  })

  const handleChangeStatus = (feedback: any, newStatus: string) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return
    updateMutation.mutate({ id: feedback.id, payload: { status: newStatus } })
  }

  const handleOpenReply = (feedback: any) => {
    setReplyText(feedback.adminReply || '')
    setReplyModal({ open: true, feedback })
  }

  const handleSendReply = () => {
    if (!replyModal.feedback || !replyText.trim()) return
    updateMutation.mutate(
      { id: replyModal.feedback.id, payload: { adminReply: replyText, status: 'reviewed' } },
      { onSuccess: () => { setReplyModal({ open: false, feedback: null }); setReplyText('') } }
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const stats = {
    pending: feedbacks.filter((f: any) => f.status === 'pending').length,
    reviewed: feedbacks.filter((f: any) => f.status === 'reviewed').length,
    resolved: feedbacks.filter((f: any) => f.status === 'resolved').length,
  }

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-xl p-4'>
          <p className='text-sm text-gray-500'>Total</p>
          <p className='text-2xl font-bold text-[#1F2524]'>{total}</p>
        </div>
        <div className='bg-white rounded-xl p-4'>
          <p className='text-sm text-gray-500'>Pending</p>
          <p className='text-2xl font-bold text-amber-500'>{stats.pending}</p>
        </div>
        <div className='bg-white rounded-xl p-4'>
          <p className='text-sm text-gray-500'>Reviewed</p>
          <p className='text-2xl font-bold text-blue-500'>{stats.reviewed}</p>
        </div>
        <div className='bg-white rounded-xl p-4'>
          <p className='text-sm text-gray-500'>Resolved</p>
          <p className='text-2xl font-bold text-green-500'>{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-4 items-center'>
        <div className='flex gap-1 bg-white rounded-lg p-1'>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(0) }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-[#1F2524] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
        <div className='flex gap-1 bg-white rounded-lg p-1'>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === s ? 'bg-[#1F2524] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='bg-white rounded-xl overflow-hidden'>
        {loading ? (
          <div className='p-12 text-center text-gray-400'>Loading...</div>
        ) : feedbacks.length === 0 ? (
          <div className='p-12 text-center text-gray-400'>No feedback found</div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100'>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>User</th>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>Category</th>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>Subject</th>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>Rating</th>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>Status</th>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>Date</th>
                <th className='text-left px-5 py-3 font-medium text-gray-500'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb: any) => (
                <tr key={fb.id} className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'>
                  <td className='px-5 py-4'>
                    <p className='font-medium text-[#1F2524]'>{fb.user?.name || 'Unknown'}</p>
                    <p className='text-xs text-gray-400'>{fb.user?.email}</p>
                  </td>
                  <td className='px-5 py-4'>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${CATEGORY_COLORS[fb.category] || 'bg-gray-100 text-gray-500'}`}>
                      {CATEGORY_LABELS[fb.category] || fb.category}
                    </span>
                  </td>
                  <td className='px-5 py-4 max-w-[200px]'>
                    <p className='font-medium text-[#1F2524] truncate'>{fb.subject}</p>
                    <p className='text-xs text-gray-400 truncate max-w-[200px]'>{fb.message}</p>
                  </td>
                  <td className='px-5 py-4'>
                    {fb.rating ? (
                      <div className='flex items-center gap-0.5'>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`w-4 h-4 ${s <= fb.rating ? 'text-[#F2B138]' : 'text-gray-200'}`} fill='currentColor' viewBox='0 0 20 20'>
                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                          </svg>
                        ))}
                        <span className='text-xs text-gray-500 ml-1'>{fb.rating}/5</span>
                      </div>
                    ) : (
                      <span className='text-xs text-gray-400'>—</span>
                    )}
                  </td>
                  <td className='px-5 py-4'>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${STATUS_COLORS[fb.status] || 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[fb.status] || 'bg-gray-400'}`} />
                      {fb.status.charAt(0).toUpperCase() + fb.status.slice(1)}
                    </span>
                  </td>
                  <td className='px-5 py-4 text-xs text-gray-500 whitespace-nowrap'>
                    {formatDate(fb.createdAt)}
                  </td>
                  <td className='px-5 py-4'>
                    <div className='flex items-center gap-2'>
                      {fb.status === 'pending' && (
                        <>
                          <button onClick={() => handleChangeStatus(fb, 'resolved')} className='text-xs text-green-600 hover:text-green-700 font-medium'>Resolve</button>
                          <button onClick={() => handleOpenReply(fb)} className='text-xs text-blue-600 hover:text-blue-700 font-medium'>Reply</button>
                        </>
                      )}
                      {fb.status === 'reviewed' && (
                        <>
                          <button onClick={() => handleChangeStatus(fb, 'resolved')} className='text-xs text-green-600 hover:text-green-700 font-medium'>Resolve</button>
                          <button onClick={() => handleChangeStatus(fb, 'pending')} className='text-xs text-amber-600 hover:text-amber-700 font-medium'>Reopen</button>
                          <button onClick={() => handleOpenReply(fb)} className='text-xs text-blue-600 hover:text-blue-700 font-medium'>Reply</button>
                        </>
                      )}
                      {fb.status === 'resolved' && (
                        <>
                          <button onClick={() => handleChangeStatus(fb, 'pending')} className='text-xs text-amber-600 hover:text-amber-700 font-medium'>Reopen</button>
                          <button onClick={() => handleOpenReply(fb)} className='text-xs text-blue-600 hover:text-blue-700 font-medium'>Reply</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between px-5 py-3 border-t border-gray-100'>
            <p className='text-xs text-gray-400'>Page {page + 1} of {totalPages}</p>
            <div className='flex gap-2'>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className='px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className='px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal.open && replyModal.feedback && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40' onClick={() => setReplyModal({ open: false, feedback: null })}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='px-6 py-4 border-b border-gray-100'>
              <h3 className='text-lg font-bold text-[#1F2524]'>Reply to Feedback</h3>
            </div>
            <div className='px-6 py-4 space-y-4'>
              <div className='bg-gray-50 rounded-lg p-3'>
                <p className='text-sm font-medium text-[#1F2524]'>{replyModal.feedback.subject}</p>
                <p className='text-xs text-gray-500 mt-1 line-clamp-3'>{replyModal.feedback.message}</p>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder='Type your reply...'
                rows={5}
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1F2524] focus:ring-1 focus:ring-[#1F2524]/10 resize-none'
              />
            </div>
            <div className='px-6 py-4 border-t border-gray-100 flex justify-end gap-3'>
              <button
                onClick={() => setReplyModal({ open: false, feedback: null })}
                className='px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || updateMutation.isPending}
                className='px-4 py-2 text-sm font-medium text-white bg-[#F2B138] hover:bg-[#D99E30] rounded-lg transition-colors disabled:opacity-50'
              >
                {updateMutation.isPending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
