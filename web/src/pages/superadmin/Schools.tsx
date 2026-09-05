import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function SuperadminSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      const res = await api.getSuperadminSchools(params);
      setSchools(res.data || res.schools || []);
    } catch (e) {
      console.error('Failed to load schools:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchools(); }, [search]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.createSchool({ name: newName.trim() });
      const school = res.data || res;
      setSchools([...schools, { ...school, _count: { users: 0 } }]);
      setCreateOpen(false);
      setNewName('');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to create school');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await api.updateSchool(id, { name: editName.trim() });
      setSchools(schools.map((s) => s.id === id ? { ...s, name: editName.trim() } : s));
      setEditingId(null);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update school');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this school? This cannot be undone.')) return;
    try {
      await api.deleteSchool(id);
      setSchools(schools.filter((s) => s.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete school');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h2 className='text-2xl font-bold text-[#011C26]'>Schools</h2>
          <p className='text-sm text-gray-500 mt-1'>{schools.length} schools</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className='bg-[#084A59] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#063945] transition-colors'
        >
          + Add School
        </button>
      </div>

      <input
        type='text'
        placeholder='Search schools...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#084A59] bg-white shadow-sm'
      />

      {loading ? (
        <div className='flex items-center justify-center h-40'>
          <div className='w-8 h-8 border-4 border-[#084A59] border-t-transparent rounded-full animate-spin' />
        </div>
      ) : schools.length === 0 ? (
        <div className='bg-white rounded-xl p-12 border border-gray-200 text-center'>
          <p className='text-gray-400 text-sm'>No schools found</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {schools.map((s) => (
            <div key={s.id} className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow'>
              {editingId === s.id ? (
                <div className='space-y-3'>
                  <input
                    type='text'
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59]'
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(s.id)}
                    autoFocus
                  />
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleUpdate(s.id)}
                      disabled={saving}
                      className='px-3 py-1.5 bg-[#084A59] text-white text-xs font-medium rounded-lg hover:bg-[#063945] disabled:opacity-50'
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className='px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='flex items-start justify-between mb-3'>
                    <h3 className='font-bold text-[#011C26] text-base'>{s.name}</h3>
                    <div className='flex gap-1'>
                      <button
                        onClick={() => { setEditingId(s.id); setEditName(s.name); }}
                        className='p-1.5 text-gray-400 hover:text-[#084A59] hover:bg-[#084A59]/10 rounded-lg transition-colors'
                        title='Edit'
                      >
                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10' />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Delete'
                      >
                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' />
                    </svg>
                    <span>{s.userCount ?? 0} users</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setCreateOpen(false)}>
          <div className='bg-white rounded-2xl w-full max-w-md shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-[#011C26] mb-4'>Add School</h3>
              <input
                type='text'
                placeholder='School name'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#084A59]'
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className='flex justify-end gap-3 px-6 pb-6'>
              <button
                onClick={() => { setCreateOpen(false); setNewName(''); }}
                className='px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className='px-5 py-2 bg-[#084A59] text-white text-sm font-medium rounded-lg hover:bg-[#063945] disabled:opacity-50 transition-colors'
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
