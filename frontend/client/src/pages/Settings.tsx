import React, { useState, useEffect } from 'react';
import { Save, Loader2, Monitor, Timer, Eye, Bell, LogOut } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { UserSettings } from '../services/api';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

/**
 * A page for managing user settings.
 *
 * This component provides a user interface for customizing various aspects of
 * the application, including display preferences, quiz behavior, accessibility,
 * and notifications. It uses the `useSettings` hook to fetch and update
 * settings.
 *
 * @returns {JSX.Element} The rendered settings page.
 */
const SettingsPage: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    try {
      await updateSettings(localSettings);
      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleResetProgress = async () => {
    setIsResetConfirmOpen(true);
  };

  const confirmResetProgress = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/reset-test-progress/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setSavedMessage("Your test progress has been successfully reset.");
        } else {
          setSavedMessage("Failed to reset test progress. Please try again.");
        }
      } catch (error) {
        console.error("Error resetting test progress:", error);
        setSavedMessage("An error occurred while resetting your test progress. Please try again.");
      }
    }
  };

  const updateLocalSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading || !localSettings) {
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              <span className="ml-2">{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>

          {savedMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
              {savedMessage}
            </div>
          )}

          <div className="space-y-6">
            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Monitor className="h-6 w-6 mr-2 text-primary" /> Display Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Theme</Label>
                  <Select value={localSettings.theme} onValueChange={(value) => updateLocalSetting('theme', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text Size</Label>
                  <Select value={localSettings.text_size} onValueChange={(value) => updateLocalSetting('text_size', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select text size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Family</Label>
                  <Select value={localSettings.font_family} onValueChange={(value) => updateLocalSetting('font_family', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                      <SelectItem value="lato">Lato</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="source-sans">Source Sans Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color Scheme</Label>
                  <Select value={localSettings.color_scheme} onValueChange={(value) => updateLocalSetting('color_scheme', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Timer className="h-6 w-6 mr-2 text-primary" /> Quiz Preferences</CardTitle>
                <CardDescription>Manage your quiz experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Advance</Label>
                    <p className="text-sm text-muted-foreground">Automatically move to next question after answering</p>
                  </div>
                  <Switch checked={localSettings.auto_advance} onCheckedChange={(checked) => updateLocalSetting('auto_advance', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Timer</Label>
                    <p className="text-sm text-muted-foreground">Display quiz timer</p>
                  </div>
                  <Switch checked={localSettings.show_timer} onCheckedChange={(checked) => updateLocalSetting('show_timer', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Timer Warnings</Label>
                    <p className="text-sm text-muted-foreground">Show alerts when time is running low</p>
                  </div>
                  <Switch checked={localSettings.timer_warnings} onCheckedChange={(checked) => updateLocalSetting('timer_warnings', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Progress Bar</Label>
                    <p className="text-sm text-muted-foreground">Display progress through quiz</p>
                  </div>
                  <Switch checked={localSettings.show_progress_bar} onCheckedChange={(checked) => updateLocalSetting('show_progress_bar', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirm Answer Changes</Label>
                    <p className="text-sm text-muted-foreground">Ask for confirmation when changing answers</p>
                  </div>
                  <Switch checked={localSettings.confirm_answer_change} onCheckedChange={(checked) => updateLocalSetting('confirm_answer_change', checked)} />
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Eye className="h-6 w-6 mr-2 text-primary" /> Accessibility</CardTitle>
                <CardDescription>Make the application easier to use.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>High Contrast</Label>
                    <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                  </div>
                  <Switch checked={localSettings.high_contrast} onCheckedChange={(checked) => updateLocalSetting('high_contrast', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reduce Animations</Label>
                    <p className="text-sm text-muted-foreground">Minimize motion effects</p>
                  </div>
                  <Switch checked={localSettings.reduce_animations} onCheckedChange={(checked) => updateLocalSetting('reduce_animations', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Keyboard Navigation</Label>
                    <p className="text-sm text-muted-foreground">Enable keyboard shortcuts</p>
                  </div>
                  <Switch checked={localSettings.keyboard_navigation} onCheckedChange={(checked) => updateLocalSetting('keyboard_navigation', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Screen Reader Support</Label>
                    <p className="text-sm text-muted-foreground">Optimize for screen readers</p>
                  </div>
                  <Switch checked={localSettings.screen_reader_support} onCheckedChange={(checked) => updateLocalSetting('screen_reader_support', checked)} />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Bell className="h-6 w-6 mr-2 text-primary" /> Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={localSettings.email_notifications} onCheckedChange={(checked) => updateLocalSetting('email_notifications', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Progress Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded to continue practicing</p>
                  </div>
                  <Switch checked={localSettings.progress_reminders} onCheckedChange={(checked) => updateLocalSetting('progress_reminders', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Achievement Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications for milestones and achievements</p>
                  </div>
                  <Switch checked={localSettings.achievement_alerts} onCheckedChange={(checked) => updateLocalSetting('achievement_alerts', checked)} />
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><LogOut className="h-6 w-6 mr-2 text-destructive" /> Account</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
                <Button
                  variant="destructive"
                  className="ml-4"
                  onClick={handleResetProgress}
                >
                  Reset Test Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        onConfirm={confirmResetProgress}
        title="Are you sure you want to reset your test progress?"
        description="This action cannot be undone."
      />
    </div>
  );
};

export default SettingsPage;