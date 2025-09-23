export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  text_size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  font_family: 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'source-sans';
  color_scheme: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
  auto_advance: boolean;
  show_timer: boolean;
  timer_warnings: boolean;
  show_progress_bar: boolean;
  confirm_answer_change: boolean;
  high_contrast: boolean;
  reduce_animations: boolean;
  keyboard_navigation: boolean;
  screen_reader_support: boolean;
  email_notifications: boolean;
  progress_reminders: boolean;
  achievement_alerts: boolean;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  text_size: 'md',
  font_family: 'inter',
  color_scheme: 'blue',
  auto_advance: true,
  show_timer: true,
  timer_warnings: true,
  show_progress_bar: true,
  confirm_answer_change: false,
  high_contrast: false,
  reduce_animations: false,
  keyboard_navigation: true,
  screen_reader_support: false,
  email_notifications: true,
  progress_reminders: true,
  achievement_alerts: true,
};

export const getUserSettings = async (): Promise<UserSettings> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storedSettings = localStorage.getItem('userSettings');
      if (storedSettings) {
        resolve(JSON.parse(storedSettings));
      } else {
        localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        resolve(defaultSettings);
      }
    }, 500); // Simulate network delay
  });
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      resolve(settings);
    }, 500); // Simulate network delay
  });
};
