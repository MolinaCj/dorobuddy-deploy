import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DailyStopwatchData {
  totalTimeSeconds: number;
  lastUpdated: string;
  date: string; // YYYY-MM-DD format in Philippine time
  lastAccumulatedTime: number; // Last time that was added to daily total
}

export function useDailyStopwatch() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyStopwatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current Philippine time (UTC+8)
  const getPhilippineTime = useCallback(() => {
    const now = new Date();
    const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
    return philippineTime;
  }, []);

  // Get today's date in Philippine timezone (YYYY-MM-DD format)
  const getTodayPhilippine = useCallback(() => {
    const philippineTime = getPhilippineTime();
    return philippineTime.toISOString().split('T')[0];
  }, [getPhilippineTime]);

  // Check if it's a new day (past 12am Philippine time)
  const isNewDay = useCallback((lastDate: string) => {
    const today = getTodayPhilippine();
    return lastDate !== today;
  }, [getTodayPhilippine]);

  // Load daily stopwatch data from localStorage
  const loadDailyData = useCallback(() => {
    if (!user) return;

    try {
      const key = `daily_stopwatch_${user.id}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const data: DailyStopwatchData = JSON.parse(stored);
        
        // Check if it's a new day, reset if so
        if (isNewDay(data.date)) {
          const newData: DailyStopwatchData = {
            totalTimeSeconds: 0,
            lastUpdated: new Date().toISOString(),
            date: getTodayPhilippine(),
            lastAccumulatedTime: 0
          };
          setDailyData(newData);
          localStorage.setItem(key, JSON.stringify(newData));
        } else {
          setDailyData(data);
        }
      } else {
        // First time user, initialize
        const newData: DailyStopwatchData = {
          totalTimeSeconds: 0,
          lastUpdated: new Date().toISOString(),
          date: getTodayPhilippine(),
          lastAccumulatedTime: 0
        };
        setDailyData(newData);
        localStorage.setItem(key, JSON.stringify(newData));
      }
    } catch (err) {
      console.error('Error loading daily stopwatch data:', err);
      setError('Failed to load daily stopwatch data');
    }
  }, [user, isNewDay, getTodayPhilippine]);

  // Save daily stopwatch data to localStorage
  const saveDailyData = useCallback((data: DailyStopwatchData) => {
    if (!user) return;

    try {
      const key = `daily_stopwatch_${user.id}`;
      localStorage.setItem(key, JSON.stringify(data));
      setDailyData(data);
    } catch (err) {
      console.error('Error saving daily stopwatch data:', err);
      setError('Failed to save daily stopwatch data');
    }
  }, [user]);

  // Add time to today's total (only the new time since last pause)
  const addTime = useCallback((currentTotalSeconds: number) => {
    if (!user || currentTotalSeconds < 0) return;

    const today = getTodayPhilippine();
    
    setDailyData(prev => {
      const currentData = prev || {
        totalTimeSeconds: 0,
        lastUpdated: new Date().toISOString(),
        date: today,
        lastAccumulatedTime: 0
      };

      // If it's a new day, reset
      if (isNewDay(currentData.date)) {
        const newData: DailyStopwatchData = {
          totalTimeSeconds: currentTotalSeconds,
          lastUpdated: new Date().toISOString(),
          date: today,
          lastAccumulatedTime: currentTotalSeconds
        };
        saveDailyData(newData);
        return newData;
      } else {
        // Only add the difference (new time since last pause)
        const newTimeToAdd = currentTotalSeconds - currentData.lastAccumulatedTime;
        const updatedData: DailyStopwatchData = {
          ...currentData,
          totalTimeSeconds: currentData.totalTimeSeconds + newTimeToAdd,
          lastAccumulatedTime: currentTotalSeconds,
          lastUpdated: new Date().toISOString()
        };
        saveDailyData(updatedData);
        return updatedData;
      }
    });
  }, [user, getTodayPhilippine, isNewDay, saveDailyData]);

  // Reset accumulated time tracking (when user manually resets stopwatch timer)
  const resetAccumulatedTime = useCallback(() => {
    if (!user) return;

    setDailyData(prev => {
      if (!prev) return prev;
      
      const updatedData: DailyStopwatchData = {
        ...prev,
        lastAccumulatedTime: 0,
        lastUpdated: new Date().toISOString()
      };
      saveDailyData(updatedData);
      return updatedData;
    });
  }, [user, saveDailyData]);

  // Reset today's total (only for testing or manual reset - not used in normal flow)
  const resetToday = useCallback(() => {
    if (!user) return;

    const today = getTodayPhilippine();
    const newData: DailyStopwatchData = {
      totalTimeSeconds: 0,
      lastUpdated: new Date().toISOString(),
      date: today,
      lastAccumulatedTime: 0
    };
    saveDailyData(newData);
  }, [user, getTodayPhilippine, saveDailyData]);

  // Get formatted time display
  const getFormattedTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // Get today's total in different formats
  const getTodayTotal = useCallback(() => {
    if (!dailyData || isNewDay(dailyData.date)) {
      return {
        seconds: 0,
        minutes: 0,
        hours: 0,
        formatted: '0s'
      };
    }

    const seconds = dailyData.totalTimeSeconds;
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(seconds / 3600 * 10) / 10;

    return {
      seconds,
      minutes,
      hours,
      formatted: getFormattedTime(seconds)
    };
  }, [dailyData, isNewDay, getFormattedTime]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  // Check for new day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (dailyData && isNewDay(dailyData.date)) {
        loadDailyData(); // This will reset the data for the new day
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [dailyData, isNewDay, loadDailyData]);

  return {
    dailyData,
    loading,
    error,
    addTime,
    resetAccumulatedTime,
    resetToday,
    getTodayTotal,
    getFormattedTime,
    isNewDay: dailyData ? isNewDay(dailyData.date) : false
  };
}
