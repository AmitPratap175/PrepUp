import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';

interface AnalyticsData {
    user: {
        name: string;
        total_score: number;
        current_streak: number;
        exam_type: string;
    };
    topic_performance: {
        [key: string]: {
            total_questions: number;
            correct_answers: number;
            accuracy: number;
        };
    };
    accuracy_over_time: Array<{
        date: string;
        accuracy: number;
        score: number;
    }>;
    streak_history: Array<{
        date: string;
        minutes_studied: number;
    }>;
    total_tests_taken: number;
}

export default function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/analytics/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <p className="text-center text-gray-500">No analytics data available.</p>
            </div>
        );
    }

    // Transform topic performance for radar chart
    const topicRadarData = Object.entries(analytics.topic_performance).map(([topic, stats]) => ({
        topic: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
        accuracy: stats.accuracy,
        questions: stats.total_questions
    }));

    // Transform topic performance for bar chart
    const topicBarData = Object.entries(analytics.topic_performance).map(([topic, stats]) => ({
        topic: topic.length > 20 ? topic.substring(0, 20) + '...' : topic,
        correct: stats.correct_answers,
        incorrect: stats.total_questions - stats.correct_answers,
        accuracy: stats.accuracy
    }));

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Performance Analytics
                </h1>
                <p className="text-gray-600">Track your progress and identify areas for improvement</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Score</p>
                                <p className="text-2xl font-bold text-purple-600">{analytics.user.total_score}</p>
                            </div>
                            <Award className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Current Streak</p>
                                <p className="text-2xl font-bold text-orange-600">{analytics.user.current_streak} 🔥</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tests Taken</p>
                                <p className="text-2xl font-bold text-blue-600">{analytics.total_tests_taken}</p>
                            </div>
                            <Target className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Exam Type</p>
                                <p className="text-2xl font-bold text-green-600">{analytics.user.exam_type.toUpperCase()}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="accuracy" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="accuracy">Accuracy Trends</TabsTrigger>
                    <TabsTrigger value="topics">Topic Performance</TabsTrigger>
                    <TabsTrigger value="radar">Strengths Radar</TabsTrigger>
                    <TabsTrigger value="streak">Study Streak</TabsTrigger>
                </TabsList>

                {/* Accuracy Over Time */}
                <TabsContent value="accuracy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Accuracy Over Time</CardTitle>
                            <CardDescription>Track your accuracy trends across recent tests</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={analytics.accuracy_over_time}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} name="Accuracy %" />
                                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Score" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Topic Performance Bar Chart */}
                <TabsContent value="topics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Topic-wise Performance</CardTitle>
                            <CardDescription>Compare your performance across different topics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={topicBarData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="correct" fill="#10b981" name="Correct" />
                                    <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Radar Chart */}
                <TabsContent value="radar">
                    <Card>
                        <CardHeader>
                            <CardTitle>Strengths & Weaknesses</CardTitle>
                            <CardDescription>Radar view of your topic accuracies</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart data={topicRadarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="topic" />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                    <Radar name="Accuracy %" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                    <Tooltip />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Streak History */}
                <TabsContent value="streak">
                    <Card>
                        <CardHeader>
                            <CardTitle>Study Streak History</CardTitle>
                            <CardDescription>Your daily study time over the past month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={analytics.streak_history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="minutes_studied" fill="#f97316" name="Minutes Studied" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
