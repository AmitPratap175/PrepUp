import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Monitor, Timer, Eye, Bell } from 'lucide-react';
import { useLocation } from "wouter";
import { useSettings } from '../contexts/SettingsContext';
import { UserSettings } from '../services/api';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [, setLocation] = useLocation();

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

  const updateLocalSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading || !localSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const SettingSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-800/40 rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-3">
        {icon}
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-white font-medium">{label}</label>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const SelectField: React.FC<{ value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; label: string }> = ({ value, onChange, options, label }) => (
    <div>
      <label className="block text-white font-medium mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {savedMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
            {savedMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Display Settings */}
          <SettingSection title="Display Settings" icon={<Monitor className="h-6 w-6 text-blue-400" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Theme"
                value={localSettings.theme}
                onChange={(value) => updateLocalSetting('theme', value as any)}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'auto', label: 'Auto (System)' },
                ]}
              />
              <SelectField
                label="Text Size"
                value={localSettings.text_size}
                onChange={(value) => updateLocalSetting('text_size', value as any)}
                options={[
                  { value: 'xs', label: 'Extra Small' },
                  { value: 'sm', label: 'Small' },
                  { value: 'md', label: 'Medium' },
                  { value: 'lg', label: 'Large' },
                  { value: 'xl', label: 'Extra Large' },
                ]}
              />
              <SelectField
                label="Font Family"
                value={localSettings.font_family}
                onChange={(value) => updateLocalSetting('font_family', value as any)}
                options={[
                  { value: 'inter', label: 'Inter' },
                  { value: 'roboto', label: 'Roboto' },
                  { value: 'open-sans', label: 'Open Sans' },
                  { value: 'lato', label: 'Lato' },
                  { value: 'poppins', label: 'Poppins' },
                  { value: 'source-sans', label: 'Source Sans Pro' },
                ]}
              />
              <SelectField
                label="Color Scheme"
                value={localSettings.color_scheme}
                onChange={(value) => updateLocalSetting('color_scheme', value as any)}
                options={[
                  { value: 'blue', label: 'Blue' },
                  { value: 'green', label: 'Green' },
                  { value: 'purple', label: 'Purple' },
                  { value: 'red', label: 'Red' },
                  { value: 'orange', label: 'Orange' },
                  { value: 'pink', label: 'Pink' },
                ]}
              />
            </div>
          </SettingSection>

          {/* Quiz Settings */}
          <SettingSection title="Quiz Preferences" icon={<Timer className="h-6 w-6 text-green-400" />}>
            <div className="space-y-4">
              <ToggleSwitch
                checked={localSettings.auto_advance}
                onChange={(checked) => updateLocalSetting('auto_advance', checked)}
                label="Auto Advance"
                description="Automatically move to next question after answering"
              />
              <ToggleSwitch
                checked={localSettings.show_timer}
                onChange={(checked) => updateLocalSetting('show_timer', checked)}
                label="Show Timer"
                description="Display quiz timer"
              />
              <ToggleSwitch
                checked={localSettings.timer_warnings}
                onChange={(checked) => updateLocalSetting('timer_warnings', checked)}
                label="Timer Warnings"
                description="Show alerts when time is running low"
              />
              <ToggleSwitch
                checked={localSettings.show_progress_bar}
                onChange={(checked) => updateLocalSetting('show_progress_bar', checked)}
                label="Show Progress Bar"
                description="Display progress through quiz"
              />
              <ToggleSwitch
                checked={localSettings.confirm_answer_change}
                onChange={(checked) => updateLocalSetting('confirm_answer_change', checked)}
                label="Confirm Answer Changes"
                description="Ask for confirmation when changing answers"
              />
            </div>
          </SettingSection>

          {/* Accessibility Settings */}
          <SettingSection title="Accessibility" icon={<Eye className="h-6 w-6 text-purple-400" />}>
            <div className="space-y-4">
              <ToggleSwitch
                checked={localSettings.high_contrast}
                onChange={(checked) => updateLocalSetting('high_contrast', checked)}
                label="High Contrast"
                description="Increase contrast for better visibility"
              />
              <ToggleSwitch
                checked={localSettings.reduce_animations}
                onChange={(checked) => updateLocalSetting('reduce_animations', checked)}
                label="Reduce Animations"
                description="Minimize motion effects"
              />
              <ToggleSwitch
                checked={localSettings.keyboard_navigation}
                onChange={(checked) => updateLocalSetting('keyboard_navigation', checked)}
                label="Keyboard Navigation"
                description="Enable keyboard shortcuts"
              />
              <ToggleSwitch
                checked={localSettings.screen_reader_support}
                onChange={(checked) => updateLocalSetting('screen_reader_support', checked)}
                label="Screen Reader Support"
                description="Optimize for screen readers"
              />
            </div>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection title="Notifications" icon={<Bell className="h-6 w-6 text-yellow-400" />}>
            <div className="space-y-4">
              <ToggleSwitch
                checked={localSettings.email_notifications}
                onChange={(checked) => updateLocalSetting('email_notifications', checked)}
                label="Email Notifications"
                description="Receive updates via email"
              />
              <ToggleSwitch
                checked={localSettings.progress_reminders}
                onChange={(checked) => updateLocalSetting('progress_reminders', checked)}
                label="Progress Reminders"
                description="Get reminded to continue practicing"
              />
              <ToggleSwitch
                checked={localSettings.achievement_alerts}
                onChange={(checked) => updateLocalSetting('achievement_alerts', checked)}
                label="Achievement Alerts"
                description="Notifications for milestones and achievements"
              />
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
