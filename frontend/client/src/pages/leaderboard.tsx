import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Award, Medal } from 'lucide-react';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

interface LeaderboardEntry {
    rank: number;
    name: string;
    email: string;
    total_score: number;
    current_streak: number;
    exam_type: string;
    is_current_user: boolean;
}

interface LeaderboardData {
    type: string;
    leaderboard: LeaderboardEntry[];
}

export default function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
    const [activeTab, setActiveTab] = useState<'score' | 'streak'>('score');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard(activeTab);
    }, [activeTab]);

    const fetchLeaderboard = async (type: 'score' | 'streak') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/leaderboard/?type=${type}&limit=50`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            const data = await response.json();
            setLeaderboardData(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Medal className="w-6 h-6 text-amber-600" />;
            default:
                return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
        }
    };

    const getRankBadgeColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
            case 2:
                return 'bg-gradient-to-r from-gray-300 to-gray-500';
            case 3:
                return 'bg-gradient-to-r from-amber-500 to-amber-700';
            default:
                return 'bg-gradient-to-r from-blue-500 to-blue-700';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Leaderboard
                        </h1>
                        <p className="text-gray-600">Compete with fellow students and climb the ranks!</p>
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex gap-4 mb-6">
                        <Button
                            onClick={() => setActiveTab('score')}
                            variant={activeTab === 'score' ? 'default' : 'outline'}
                            className="flex items-center gap-2"
                        >
                            <Award className="w-4 h-4" />
                            Top Scorers
                        </Button>
                        <Button
                            onClick={() => setActiveTab('streak')}
                            variant={activeTab === 'streak' ? 'default' : 'outline'}
                            className="flex items-center gap-2"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Longest Streaks
                        </Button>
                    </div>

                    {/* Leaderboard Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {activeTab === 'score' ? (
                                    <>
                                        <Award className="w-5 h-5" />
                                        Top Scorers
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-5 h-5" />
                                        Longest Streaks
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                </div>
                            ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                                <div className="space-y-2">
                                    {leaderboardData.leaderboard.map((entry) => (
                                        <div
                                            key={entry.rank}
                                            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${entry.is_current_user
                                                ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-400 shadow-md'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className="flex-shrink-0 w-12 flex justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {entry.name}
                                                        {entry.is_current_user && (
                                                            <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                                                                You
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">{entry.email}</p>
                                                <p className="text-xs text-gray-500 uppercase">{entry.exam_type}</p>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex gap-6 text-right">
                                                <div>
                                                    <p className="text-sm text-gray-600">Score</p>
                                                    <p className="text-xl font-bold text-purple-600">{entry.total_score}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Streak</p>
                                                    <p className="text-xl font-bold text-orange-600">{entry.current_streak} 🔥</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No leaderboard data available yet.</p>
                                    <p className="text-sm mt-2">Start practicing to see your ranking!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Trophy className="w-5 h-5 text-purple-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">How Rankings Work</h3>
                                    <p className="text-sm text-gray-600">
                                        Your score increases with every correct answer and completed test. Maintain a daily streak by
                                        practicing every day. Compete with students preparing for the same exam!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
