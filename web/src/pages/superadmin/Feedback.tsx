import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const STATUS_OPTIONS = ['pending', 'in_progress', 'resolved', 'closed'];
const CATEGORY_OPTIONS = ['bug', 'feature', 'content', 'general', 'other'];

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function SuperadminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyModal, setReplyModal] = useState<{ open: boolean; fb: any }>({ open: false, fb: null });
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [sending, setSending] = useState(false);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.getSuperadminFeedback(params);
      setFeedbacks(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      console.error('Failed to load feedback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [statusFilter, categoryFilter]);
  useEffect(() => { loadFeedback(); }, [page, statusFilter, categoryFilter]);

  const handleReply = async () => {
    if (!replyModal.fb) return;
    setSending(true);
    try {
      await api.superadminUpdateFeedback(replyModal.fb.id, { status: replyStatus, adminReply: replyText });
      setFeedbacks(feedbacks.map((f) => f.id === replyModal.fb.id ? { ...f, status: replyStatus, adminReply: replyText } : f));
      setReplyModal({ open: false, fb: null });
      setReplyText('');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update feedback');
    } finally {
      setSending(false);
    }
  };

  const handleQuickUpdate = async (id: string, status: string) => {
    try {
      await api.superadminUpdateFeedback(id, { status });
      setFeedbacks(feedbacks.map((f) => f.id === id ? { ...f, status } : f));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-[#011C26]'>Feedback</h2>
        <p className='text-sm text-gray-500 mt-1'>{total} feedback items</p>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-wrap gap-3'>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59]'
        >
          <option value=''>All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59]'
        >
          <option value=''>All Categories</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className='flex items-center justify-center h-40'>
          <div className='w-8 h-8 border-4 border-[#084A59] border-t-transparent rounded-full animate-spin' />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className='bg-white rounded-xl p-12 border border-gray-200 text-center'>
          <p className='text-gray-400 text-sm'>No feedback found</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {feedbacks.map((fb) => (
            <div key={fb.id} className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-start justify-between gap-4 mb-3'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap mb-1'>
                    <h4 className='font-bold text-[#011C26] text-sm'>{fb.subject}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[fb.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {fb.status?.replace('_', ' ')}
                    </span>
                    <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'>
                      {fb.category}
                    </span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    From {fb.user?.name || fb.user?.email || 'Unknown'} · {fb.user?.role} · {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
                {fb.rating && (
                  <div className='flex items-center gap-1 shrink-0'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-4 h-4 ${star <= fb.rating ? 'text-[#F2B138]' : 'text-gray-200'}`} fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
              <p className='text-sm text-gray-700 mb-3 whitespace-pre-wrap'>{fb.message}</p>
              {fb.adminReply && (
                <div className='bg-[#084A59]/5 rounded-lg p-3 mb-3 border border-[#084A59]/10'>
                  <p className='text-xs font-semibold text-[#084A59] mb-1'>Admin Reply</p>
                  <p className='text-sm text-gray-700'>{fb.adminReply}</p>
                </div>
              )}
              <div className='flex items-center gap-2'>
                {fb.status !== 'resolved' && (
                  <button
                    onClick={() => handleQuickUpdate(fb.id, 'resolved')}
                    className='px-3 py-1.5 text-xs font-medium text-[#12A67C] hover:bg-[#12A67C]/10 rounded-lg transition-colors'
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => { setReplyModal({ open: true, fb }); setReplyText(fb.adminReply || ''); setReplyStatus(fb.status || 'resolved'); }}
                  className='px-3 py-1.5 text-xs font-medium text-[#084A59] hover:bg-[#084A59]/10 rounded-lg transition-colors'
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className='px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50'
          >
            Previous
          </button>
          <span className='text-sm text-gray-500'>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className='px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50'
          >
            Next
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal.open && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setReplyModal({ open: false, fb: null })}>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='p-6 space-y-4'>
              <h3 className='text-lg font-bold text-[#011C26]'>Reply to Feedback</h3>
              <div className='bg-gray-50 rounded-lg p-3'>
                <p className='text-xs text-gray-500 mb-1'>{replyModal.fb?.user?.name || replyModal.fb?.user?.email}</p>
                <p className='text-sm font-medium text-[#011C26]'>{replyModal.fb?.subject}</p>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Status</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59]'
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59] resize-none'
                  placeholder='Type your reply...'
                />
              </div>
            </div>
            <div className='flex justify-end gap-3 px-6 pb-6'>
              <button
                onClick={() => setReplyModal({ open: false, fb: null })}
                className='px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={sending}
                className='px-5 py-2 bg-[#084A59] text-white text-sm font-medium rounded-lg hover:bg-[#063945] disabled:opacity-50 transition-colors'
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
