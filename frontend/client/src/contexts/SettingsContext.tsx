import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSettings, getUserSettings, updateUserSettings } from '../services/api';

/**
 * @interface SettingsContextType
 * @property {UserSettings | null} settings - The current user settings, or null if not loaded.
 * @property {boolean} loading - True if the settings are currently being fetched.
 * @property {(newSettings: UserSettings) => Promise<void>} updateSettings - Function to update the user settings.
 */
interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  updateSettings: (newSettings: UserSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Provides user settings to its children components.
 *
 * This provider fetches user settings on mount and provides a function to
 * update them. It manages the loading state and makes the settings data
 * available throughout the application via the `useSettings` hook.
 *
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The settings provider component.
 */
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userSettings = await getUserSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: UserSettings) => {
    try {
      const updatedSettings = await updateUserSettings(newSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * A custom hook to access the user settings context.
 *
 * This hook provides a convenient way to access the current settings, loading
 * state, and the update function from the `SettingsContext`.
 *
 * @returns {SettingsContextType} The settings context.
 * @throws {Error} If used outside of a `SettingsProvider`.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
