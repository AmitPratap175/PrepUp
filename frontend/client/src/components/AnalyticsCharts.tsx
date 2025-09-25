import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course, TestSession, UserProgress } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/contexts/auth-context";

async function fetchDashboardData(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return response.json();
}

export function AnalyticsCharts() {
    const { user } = useAuth();

    const { data: courses } = useQuery<Course[]>({
        queryKey: ["/api/courses", { examType: user?.exam_type }],
        queryFn: () => fetchDashboardData(`/api/courses?examType=${user?.exam_type}`),
        enabled: !!user,
    });

    const { data: testSessions } = useQuery<TestSession[]>({
        queryKey: ["/api/users", user?.id, "test-sessions"],
        queryFn: () => fetchDashboardData(`/api/users/${user?.id}/test-sessions`),
        enabled: !!user,
    });

    const { data: userProgress } = useQuery<UserProgress[]>({
        queryKey: ["/api/users", user?.id, "progress"],
        queryFn: () => fetchDashboardData(`/api/users/${user?.id}/progress`),
        enabled: !!user,
    });

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

    return (
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
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
            <Card>
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