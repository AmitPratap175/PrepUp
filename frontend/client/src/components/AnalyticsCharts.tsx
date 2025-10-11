import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course, TestSession, UserProgress } from "@shared/schema";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AnalyticsChartsProps {
  testSessions: TestSession[] | undefined;
  userProgress: UserProgress[] | undefined;
  courses: Course[] | undefined;
  weekSummary: { date: string; hours: number }[] | undefined;
}

export function AnalyticsCharts({ testSessions, userProgress, courses, weekSummary }: AnalyticsChartsProps) {
    const scoreData = testSessions
        ?.filter(session => session.isCompleted && session.score && session.maxScore)
        .map(session => ({
            name: new Date(session.completedAt ?? 0).toLocaleDateString(),
            score: Math.round(((session.score ?? 0) / (session.maxScore ?? 1)) * 100),
        }));

    const progressData = userProgress?.map(progress => ({
        name: courses?.find(c => c.id === progress.courseId)?.title ?? "Unknown Course",
        progress: progress.progress,
    }));

    const formattedWeekSummary = weekSummary?.map(day => ({
        ...day,
        date: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
    }));

    return (
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Study Hours (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedWeekSummary}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="hours" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Test Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scoreData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Course Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="progress" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
