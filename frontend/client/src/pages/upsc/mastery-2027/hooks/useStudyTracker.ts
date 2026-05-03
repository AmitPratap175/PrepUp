import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';

const HEARTBEAT_INTERVAL = 15000; // 15 seconds

export function useStudyTracker() {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = async () => {
    if (!token) return;

    try {
      await fetch('/api/auth/study-heartbeat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ duration: HEARTBEAT_INTERVAL / 1000 }),
      });
    } catch (error) {
      console.error('Failed to send study heartbeat:', error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      startTracking();
    } else {
      stopTracking();
    }
  };

  const startTracking = () => {
    if (intervalRef.current) return;
    // Send a heartbeat immediately on start
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (token) {
      startTracking();
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', sendHeartbeat);
    }

    return () => {
      stopTracking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendHeartbeat);
    };
  }, [token]);
}
