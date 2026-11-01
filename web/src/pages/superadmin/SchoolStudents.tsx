import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';

type Student = {
  id: string;
  name?: string;
  email: string;
  username?: string;
  school?: string;
  level?: string;
  isActive: boolean;
  createdAt?: string;
};

export default function SuperadminSchoolStudents() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [schoolName, setSchoolName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!schoolId) return;
      try {
        const schoolsResponse = await api.getSuperadminSchools();
        const school = (schoolsResponse.data || []).find((item: { id: string }) => item.id === schoolId);
        if (!school) {
          setError('School not found');
          return;
        }

        setSchoolName(school.name);
        const usersResponse = await api.getSuperadminUsers({
          school: school.name,
          role: 'student',
          limit: 1000,
          offset: 0,
        });
        setStudents(usersResponse.data || usersResponse.users || []);
      } catch (loadError) {
        console.error('Failed to load school students:', loadError);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link to='/superadmin/schools' className='text-sm font-medium text-[#084A59] hover:underline'>
          ← Schools
        </Link>
        <div>
          <h2 className='text-2xl font-bold text-[#011C26]'>{schoolName || 'School Students'}</h2>
          <p className='text-sm text-gray-500 mt-1'>Students registered at this school</p>
        </div>
      </div>

      <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center h-40'>
            <div className='w-8 h-8 border-4 border-[#084A59] border-t-transparent rounded-full animate-spin' />
          </div>
        ) : error ? (
          <p className='p-8 text-center text-red-600'>{error}</p>
        ) : students.length === 0 ? (
          <p className='p-12 text-center text-gray-400'>No students found for this school</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-100'>
                  <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Student</th>
                  <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Level</th>
                  <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Status</th>
                  <th className='text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase'>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className='border-b border-gray-50'>
                    <td className='px-6 py-4'>
                      <p className='text-sm font-semibold text-[#011C26]'>{student.name || 'No name'}</p>
                      <p className='text-xs text-gray-500'>{student.email}</p>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600 capitalize'>{student.level || '—'}</td>
                    <td className='px-6 py-4'>
                      <span className={`text-xs font-medium ${student.isActive ? 'text-[#12A67C]' : 'text-red-600'}`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
