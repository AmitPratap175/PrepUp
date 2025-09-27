import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AnalyticsData {
  overallProgress: number;
  progressChange: number;
  subjectScores: { [subject: string]: number };
  performanceComparison: {
    [subject: string]: {
      user: number;
      average: number;
    };
  };
  performanceTimeline: {
    title: string;
    date: string;
    score: number;
    total: number;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data: analytics, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ['analytics', user?.id],
    queryFn: () => apiRequest('GET', `/api/users/${user?.id}/analytics/`),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading analytics...
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Error loading analytics data.
      </div>
    );
  }

  const subjectScoresData = Object.entries(analytics.subjectScores).map(([name, score]) => ({
    name,
    score,
  }));

  const overallProgressData = analytics.performanceTimeline.map(item => ({
    name: new Date(item.date).toLocaleDateString(),
    score: item.score,
  })).reverse();

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="flex-1 px-10 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-gray-900 text-4xl font-bold leading-tight tracking-tight dark:text-gray-100">Analytics Dashboard</h1>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700 lg:col-span-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-lg font-medium leading-normal dark:text-gray-400">Overall Progress</p>
                  <p className="text-[var(--primary-color)] text-6xl font-bold leading-tight tracking-tighter">{analytics.overallProgress}%</p>
                </div>
                <div className="flex items-center gap-2 text-lg font-medium">
                  <span className="text-gray-500 dark:text-gray-400">Last 30 Days</span>
                  <span className="text-green-500 text-xl font-bold flex items-center gap-1">
                    <svg className="feather feather-arrow-up-right" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                      <line x1="7" x2="17" y1="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                    <span>+{analytics.progressChange}%</span>
                  </span>
                </div>
              </div>
              <div className="flex min-h-[250px] flex-1 flex-col justify-end pt-4">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={overallProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="var(--primary-color)" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700 lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-lg font-medium leading-normal dark:text-gray-400">Subject Scores</p>
                </div>
              </div>
              <div className="grid min-h-[250px] grid-flow-col auto-cols-fr gap-4 items-end justify-items-center px-3 pt-4">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={subjectScoresData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="score" fill="var(--primary-color)" />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-gray-900 text-2xl font-bold leading-tight tracking-tight mb-6 dark:text-gray-100">Personalized Study Recommendations</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* This section can be made dynamic later */}
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100">Performance Comparison</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[var(--primary-color)]"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(analytics.performanceComparison).map(([subject, scores]) => (
                    <div className="flex flex-col items-center gap-4" key={subject}>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{subject}</p>
                        <div className="relative h-48 w-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    data={[{ name: 'average', value: scores.average, fill: '#3b82f6' }, { name: 'user', value: scores.user, fill: 'var(--primary-color)'}]}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <RadialBar
                                        minAngle={15}
                                        background
                                        clockWise
                                        dataKey='value'
                                    />
                                    <Tooltip />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{scores.user}%</p>
                                <p className="text-sm text-blue-500">Avg. {scores.average}%</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-gray-900 text-2xl font-bold leading-tight tracking-tight mb-4 dark:text-gray-100">Performance Timeline</h2>
            <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <div className="absolute bottom-6 top-6 left-12 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-10">
                {analytics.performanceTimeline.map((item, index) => (
                    <div className="relative pl-12" key={index}>
                        <div className={`absolute -left-3.5 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 ring-8 ring-white dark:ring-gray-800`}>
                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                        <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{new Date(item.date).toLocaleDateString()}</time>
                        <p className="text-base font-normal text-gray-600 dark:text-gray-400">Achieved a score of {item.score}/{item.total}.</p>
                    </div>
                ))}
              </div>
            </div>
          </div>
          {/* Other sections like Leaderboard and Achievements can be made dynamic later */}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}