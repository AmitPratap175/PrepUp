import React, { useState, useEffect } from 'react';
import { Save, Loader2, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface DailyTargetSettings {
    varcQuestions: number;
    dilrQuestions: number;
    qaQuestions: number;
    timePerQuestion: number;
}

const DailyTargetsSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<DailyTargetSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth(); // Ensure authenticated

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/daily-targets/settings/', {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else {
                throw new Error('Failed to fetch settings');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load settings.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const response = await fetch('/api/daily-targets/settings/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
                toast({
                    title: "Success",
                    description: "Daily target settings saved.",
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof DailyTargetSettings, value: string) => {
        if (!settings) return;
        const numValue = parseInt(value) || 0;
        setSettings({ ...settings, [key]: numValue });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Daily Targets Settings</h1>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                                    Question Configuration
                                </CardTitle>
                                <CardDescription>
                                    Set the number of questions you want for each subject in your daily target.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="varc">VARC Questions</Label>
                                    <Input
                                        id="varc"
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={settings?.varcQuestions}
                                        onChange={(e) => updateSetting('varcQuestions', e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Number of Verbal Ability questions.</p>
                                </div>
                                <div>
                                    <Label htmlFor="dilr">DILR Questions</Label>
                                    <Input
                                        id="dilr"
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={settings?.dilrQuestions}
                                        onChange={(e) => updateSetting('dilrQuestions', e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Number of Data Interpretation questions.</p>
                                </div>
                                <div>
                                    <Label htmlFor="qa">Quant Questions</Label>
                                    <Input
                                        id="qa"
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={settings?.qaQuestions}
                                        onChange={(e) => updateSetting('qaQuestions', e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Number of Quantitative Aptitude questions.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-primary" />
                                    Time Settings
                                </CardTitle>
                                <CardDescription>
                                    Configure the time allocated per question.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <Label htmlFor="time">Time Per Question (seconds)</Label>
                                    <Input
                                        id="time"
                                        type="number"
                                        min="10"
                                        max="600"
                                        value={settings?.timePerQuestion}
                                        onChange={(e) => updateSetting('timePerQuestion', e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Duration allocated for each question in seconds.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-500/90">
                                <p className="font-semibold mb-1">Note about Daily Targets</p>
                                Changes to these settings will apply to your next daily target generation. If you have already generated today's target, these changes will take effect tomorrow.
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
};

export default DailyTargetsSettingsPage;
