import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Overview {
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalAdmins?: number;
  totalSchools?: number;
  totalSubjects?: number;
  totalChapters?: number;
  totalLessons?: number;
  totalQuizzes?: number;
  totalQuizAttempts?: number;
  totalAssessments?: number;
  totalAssessmentAttempts?: number;
  newStudentsThisMonth?: number;
  totalExams?: number;
  totalExamAttempts?: number;
  activeUsers?: number;
  recentUsers?: any[];
}

export default function SuperadminDashboard() {
  const [overview, setOverview] = useState<Overview>({});
  const [signupTrend, setSignupTrend] = useState<any[]>([]);
  const [weeklyActive, setWeeklyActive] = useState<any>(null);
  const [topSubjects, setTopSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, trend, wau, quiz] = await Promise.allSettled([
          api.getSuperadminOverview(),
          api.getSuperadminSignupTrend(),
          api.getSuperadminWAU(),
          api.getSuperadminQuizStats(),
        ]);

        if (ov.status === 'fulfilled') {
          const d = ov.value as any;
          setOverview(d.overview || d);
          setTopSubjects(d.topSubjects || d.topPerformingSubjects || []);
        }
        if (trend.status === 'fulfilled') {
          const t = trend.value as any;
          setSignupTrend(t.trend || t.data || []);
        }
        if (wau.status === 'fulfilled') setWeeklyActive(wau.value);
      } catch (e) {
        console.error('Failed to load superadmin dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-8 h-8 border-4 border-[#084A59] border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  const stats = [
    { label: 'Total Students', value: overview.totalStudents ?? 0, color: 'text-[#12A67C]' },
    { label: 'Teachers', value: overview.totalTeachers ?? 0, color: 'text-[#084A59]' },
    { label: 'Admins', value: overview.totalAdmins ?? 0, color: 'text-[#F2B138]' },
    { label: 'Schools', value: overview.totalSchools ?? 0, color: 'text-[#BF522A]' },
    { label: 'Subjects', value: overview.totalSubjects ?? 0, color: 'text-[#084A59]' },
    { label: 'Chapters', value: overview.totalChapters ?? 0, color: 'text-[#12A67C]' },
    { label: 'Lessons', value: overview.totalLessons ?? 0, color: 'text-[#BF522A]' },
    { label: 'Quizzes', value: overview.totalQuizzes ?? 0, color: 'text-[#F2B138]' },
    { label: 'Quiz Attempts', value: overview.totalQuizAttempts ?? 0, color: 'text-[#084A59]' },
    { label: 'Exams', value: overview.totalExams ?? 0, color: 'text-[#12A67C]' },
    { label: 'Exam Attempts', value: overview.totalExamAttempts ?? 0, color: 'text-[#BF522A]' },
    { label: 'New This Month', value: overview.newStudentsThisMonth ?? 0, color: 'text-[#F2B138]' },
  ];

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-bold text-[#011C26]'>Platform Overview</h2>
        <p className='text-sm text-gray-500 mt-1'>Complete system analytics</p>
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {stats.map((s) => (
          <div key={s.label} className='bg-white rounded-xl p-5 border border-gray-200 shadow-sm'>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Signup trend */}
      {signupTrend.length > 0 && (
        <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
          <h3 className='text-lg font-bold text-[#011C26] mb-4'>Signup Trend (Last 30 Days)</h3>
          <div className='space-y-2'>
            {signupTrend.slice(0, 10).map((day: any, i: number) => (
              <div key={i} className='flex items-center gap-3'>
                <span className='text-xs text-gray-500 w-24 shrink-0'>{day.date || day.label}</span>
                <div className='flex-1 bg-gray-100 rounded-full h-4 overflow-hidden'>
                  <div
                    className='h-full bg-[#12A67C] rounded-full transition-all'
                    style={{ width: `${Math.min((day.count / Math.max(...signupTrend.map((d: any) => d.count || 0))) * 100, 100)}%` }}
                  />
                </div>
                <span className='text-xs font-medium text-gray-700 w-8 text-right'>{day.count || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top subjects */}
      {topSubjects.length > 0 && (
        <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
          <h3 className='text-lg font-bold text-[#011C26] mb-4'>Top Performing Subjects</h3>
          <div className='space-y-3'>
            {topSubjects.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <span className='w-7 h-7 rounded-full bg-[#084A59] text-white text-xs flex items-center justify-center font-bold'>
                    {i + 1}
                  </span>
                  <span className='font-medium text-sm text-[#011C26]'>{s.name || s.subjectName}</span>
                </div>
                <span className='text-sm font-semibold text-[#12A67C]'>
                  {s.avgScore ?? s.averageScore ?? s.average ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
