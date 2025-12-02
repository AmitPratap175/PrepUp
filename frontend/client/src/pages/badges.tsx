import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge as BadgeIcon, Lock, Trophy, TrendingUp, Users, BookOpen } from 'lucide-react';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon_emoji: string;
    icon_url: string | null;
    category: string;
    points: number;
    criteria?: any;
}

interface UserBadge extends Badge {
    earned_at: string;
}

interface BadgesData {
    badges: UserBadge[];
    total_points: number;
}

export default function BadgesPage() {
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [userBadges, setUserBadges] = useState<BadgesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('earned');

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Fetch all available badges
            const allResponse = await fetch('/api/badges/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            const allData = await allResponse.json();
            setAllBadges(allData.badges);

            // Fetch user's earned badges
            const userResponse = await fetch('/api/user/badges/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            const userData = await userResponse.json();
            setUserBadges(userData);
        } catch (error) {
            console.error('Error fetching badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'test':
                return <Trophy className="w-5 h-5" />;
            case 'streak':
                return <TrendingUp className="w-5 h-5" />;
            case 'community':
                return <Users className="w-5 h-5" />;
            case 'learning':
                return <BookOpen className="w-5 h-5" />;
            default:
                return <BadgeIcon className="w-5 h-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'test':
                return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'streak':
                return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'community':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'learning':
                return 'bg-green-100 text-green-700 border-green-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const isEarned = (badgeId: string) => {
        return userBadges?.badges.some(b => b.id === badgeId);
    };

    const getEarnedDate = (badgeId: string) => {
        const earned = userBadges?.badges.find(b => b.id === badgeId);
        return earned ? new Date(earned.earned_at).toLocaleDateString() : null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    </div>
                </main>
                <AppFooter />
            </div>
        );
    }

    const earnedBadges = userBadges?.badges || [];
    const unearnedBadges = allBadges.filter(b => !isEarned(b.id));

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Badges & Achievements
                        </h1>
                        <p className="text-gray-600">Collect badges by completing challenges and reaching milestones</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Badges Earned</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {earnedBadges.length} / {allBadges.length}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Points</p>
                                    <p className="text-3xl font-bold text-orange-600">{userBadges?.total_points || 0}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Completion</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {allBadges.length > 0 ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0}%
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Badges Grid */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="earned">Earned ({earnedBadges.length})</TabsTrigger>
                            <TabsTrigger value="available">Available ({unearnedBadges.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="earned">
                            {earnedBadges.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-500 mb-2">No badges earned yet</p>
                                        <p className="text-sm text-gray-400">Complete tests and challenges to earn your first badge!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {earnedBadges.map((badge) => (
                                        <Card key={badge.id} className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="text-5xl mb-2">{badge.icon_emoji}</div>
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(badge.category)}`}>
                                                        {badge.category}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-lg">{badge.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-purple-600 font-semibold">+{badge.points} points</span>
                                                    <span className="text-gray-500">Earned {getEarnedDate(badge.id)}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="available">
                            {unearnedBadges.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                                        <p className="text-gray-700 mb-2 text-lg font-semibold">Congratulations!</p>
                                        <p className="text-gray-500">You've earned all available badges!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {unearnedBadges.map((badge) => (
                                        <Card key={badge.id} className="border-2 border-gray-200 bg-gray-50 opacity-75 hover:opacity-100 transition-opacity">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="relative">
                                                        <div className="text-5xl mb-2 grayscale">{badge.icon_emoji}</div>
                                                        <Lock className="w-6 h-6 absolute -top-1 -right-1 text-gray-400" />
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(badge.category)}`}>
                                                        {badge.category}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-lg text-gray-700">{badge.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 font-semibold">+{badge.points} points</span>
                                                    <span className="text-gray-400">Locked</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
