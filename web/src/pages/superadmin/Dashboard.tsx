import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Overview {
  users?: {
    total?: number;
    students?: number;
    teachers?: number;
    admins?: number;
  };
  content?: {
    subjects?: number;
    chapters?: number;
    lessons?: number;
  };
  quizzes?: {
    total?: number;
    totalAttempts?: number;
  };
  exams?: {
    total?: number;
    totalAttempts?: number;
  };
  assessments?: {
    totalAttempts?: number;
  };
  schools?: number;
  newStudentsThisMonth?: number;
}

function SignupTrendChart({ data }: { data: any[] }) {
  const chartWidth = 900;
  const chartHeight = 280;
  const padding = { top: 24, right: 24, bottom: 42, left: 42 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const points = data.map((day, index) => ({
    label: day.date || day.label || `Day ${index + 1}`,
    total: Number(day.total ?? day.count ?? 0),
  }));
  const maxValue = Math.max(...points.map((point) => point.total), 1);
  const x = (index: number) =>
    padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.total)}`).join(' ');
  const areaPath = `${linePath} L ${x(points.length - 1)} ${padding.top + plotHeight} L ${x(0)} ${padding.top + plotHeight} Z`;
  const gridValues = Array.from({ length: 4 }, (_, index) => Math.round((maxValue * index) / 3));
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className='w-full overflow-x-auto'>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className='w-full min-w-[620px] h-[280px]'
        role='img'
        aria-label='Signup trend line chart'
      >
        <defs>
          <linearGradient id='signup-area-gradient' x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0%' stopColor='#12A67C' stopOpacity='0.28' />
            <stop offset='100%' stopColor='#12A67C' stopOpacity='0.02' />
          </linearGradient>
        </defs>

        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={y(value)}
              y2={y(value)}
              stroke='#E5E7EB'
              strokeDasharray='4 4'
            />
            <text x={padding.left - 10} y={y(value) + 4} textAnchor='end' className='fill-gray-400 text-[11px]'>
              {value}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
          stroke='#CBD5E1'
        />
        <path d={areaPath} fill='url(#signup-area-gradient)' />
        <path d={linePath} fill='none' stroke='#12A67C' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <title>{`${point.label}: ${point.total} signup${point.total === 1 ? '' : 's'}`}</title>
            <circle cx={x(index)} cy={y(point.total)} r='5' fill='white' stroke='#12A67C' strokeWidth='3' />
            {(index % labelStep === 0 || index === points.length - 1) && (
              <text x={x(index)} y={chartHeight - 14} textAnchor='middle' className='fill-gray-500 text-[11px]'>
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function SuperadminDashboard() {
  const [overview, setOverview] = useState<Overview>({});
  const [signupTrend, setSignupTrend] = useState<any[]>([]);
  const [topSubjects, setTopSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, trend] = await Promise.allSettled([
          api.getSuperadminOverview(),
          api.getSuperadminSignupTrend(),
        ]);

        if (ov.status === 'fulfilled') {
          const d = ov.value as any;
          setOverview(d.overview || d.data || d);
          setTopSubjects(d.topSubjects || d.topPerformingSubjects || []);
        }
        if (trend.status === 'fulfilled') {
          const t = trend.value as any;
          setSignupTrend(t.trend || t.data?.trend || t.data || []);
        }
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

  const users = overview.users || {};
  const content = overview.content || {};
  const quizzes = overview.quizzes || {};
  const exams = overview.exams || {};
  const assessments = overview.assessments || {};
  const stats = [
    { label: 'Total Students', value: users.students ?? 0, color: 'text-[#12A67C]' },
    { label: 'Teachers', value: users.teachers ?? 0, color: 'text-[#084A59]' },
    { label: 'Admins', value: users.admins ?? 0, color: 'text-[#F2B138]' },
    { label: 'Schools', value: overview.schools ?? 0, color: 'text-[#BF522A]' },
    { label: 'Subjects', value: content.subjects ?? 0, color: 'text-[#084A59]' },
    { label: 'Chapters', value: content.chapters ?? 0, color: 'text-[#12A67C]' },
    { label: 'Lessons', value: content.lessons ?? 0, color: 'text-[#BF522A]' },
    { label: 'Quizzes', value: quizzes.total ?? 0, color: 'text-[#F2B138]' },
    { label: 'Quiz Attempts', value: quizzes.totalAttempts ?? 0, color: 'text-[#084A59]' },
    { label: 'Exams', value: exams.total ?? 0, color: 'text-[#12A67C]' },
    { label: 'Exam Attempts', value: exams.totalAttempts ?? 0, color: 'text-[#BF522A]' },
    { label: 'Assessment Attempts', value: assessments.totalAttempts ?? 0, color: 'text-[#084A59]' },
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
          <SignupTrendChart data={signupTrend} />
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
