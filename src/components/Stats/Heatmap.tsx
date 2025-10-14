// components/Stats/Heatmap.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, TrendingUp, Flame, Target, Clock } from 'lucide-react';
import { HeatmapData, HeatmapResponse } from '@/types/api';
import { useStats } from '@/hooks/useStats';
import { useSettings } from '@/hooks/SettingsProvider';

interface HeatmapProps {
  data: HeatmapResponse;
  compact?: boolean;
  showLegend?: boolean;
  showStats?: boolean;
  className?: string;
}

interface DayData extends HeatmapData {
  dayOfWeek: number;
  weekIndex: number;
  month: string;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

// Enhanced intensity level colors with better visual distinction
const INTENSITY_COLORS = [
  'bg-gray-100 dark:bg-gray-800', // 0 - no activity
  'bg-green-200 dark:bg-green-900', // 1 - very low activity
  'bg-green-300 dark:bg-green-800', // 2 - low activity
  'bg-green-400 dark:bg-green-700', // 3 - medium activity
  'bg-green-500 dark:bg-green-600', // 4 - high activity
  'bg-green-600 dark:bg-green-500', // 5 - very high activity
  'bg-green-700 dark:bg-green-400', // 6 - extremely high activity
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Optimized intensity calculation based on multiple activity factors
const calculateOptimizedIntensity = (
  count: number, 
  intensity: number, 
  totalSessions: number, 
  maxDailySessions: number,
  userActivityLevel: 'low' | 'medium' | 'high' | 'expert',
  dateStr: string
): number => {
  // Base intensity from data
  let optimizedIntensity = intensity;
  
  // Factor 1: Session count relative to user's typical activity
  const sessionRatio = count / Math.max(maxDailySessions, 1);
  
  // Factor 2: User activity level adjustment
  const activityMultipliers = {
    'low': 1.2,      // Boost intensity for low-activity users
    'medium': 1.0,   // No adjustment
    'high': 0.8,     // Slightly reduce for high-activity users
    'expert': 0.6    // More reduction for expert users
  };
  
  // Factor 3: Recent activity bonus (if this is a recent day)
  const today = new Date();
  const isRecent = (dateStr: string) => {
    const date = new Date(dateStr);
    const daysDiff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // Last week
  };
  
  // Calculate optimized intensity
  let finalIntensity = Math.min(
    Math.max(
      Math.round(
        (sessionRatio * 3 + intensity * 0.7) * activityMultipliers[userActivityLevel]
      ),
      0
    ),
    6 // Max intensity level
  );
  
  // Apply recent activity bonus
  if (count > 0 && isRecent(dateStr)) {
    finalIntensity = Math.min(finalIntensity + 1, 6);
  }
  
  return finalIntensity;
};

export default function Heatmap({ 
  data, 
  compact = false, 
  showLegend = true, 
  showStats = true,
  className = '' 
}: HeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const { settings } = useSettings();

  // Determine user activity level based on their data
  const getUserActivityLevel = useMemo(() => {
    const totalSessions = data.total_sessions;
    const activeDays = data.data.filter(d => d.count > 0).length;
    const totalDays = data.data.length;
    const averageSessionsPerDay = totalSessions / Math.max(totalDays, 1);
    const maxDailySessions = Math.max(...data.data.map(d => d.count), 0);
    
    // Activity level classification
    if (averageSessionsPerDay >= 5 || maxDailySessions >= 10) {
      return 'expert';
    } else if (averageSessionsPerDay >= 3 || maxDailySessions >= 6) {
      return 'high';
    } else if (averageSessionsPerDay >= 1.5 || maxDailySessions >= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }, [data]);

  // Transform raw data into grid format with optimized intensity
  const gridData = useMemo(() => {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of date strings to data
    const dataMap = new Map<string, HeatmapData>();
    data.data.forEach(item => {
      dataMap.set(item.date, item);
    });

    // Calculate max daily sessions for intensity optimization
    const maxDailySessions = Math.max(...data.data.map(d => d.count), 1);

    // Generate all dates in range
    const days: DayData[] = [];
    const current = new Date(startDate);
    
    // Start from the beginning of the week that contains startDate
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - current.getDay());

    let weekIndex = 0;
    const processDate = new Date(startOfWeek);

    while (processDate <= endDate) {
      const dateStr = processDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr);
      const count = dayData?.count || 0;
      const originalIntensity = dayData?.intensity || 0;
      
      // Calculate optimized intensity
      const optimizedIntensity = calculateOptimizedIntensity(
        count,
        originalIntensity,
        data.total_sessions,
        maxDailySessions,
        getUserActivityLevel,
        dateStr
      );
      
      days.push({
        date: dateStr,
        count,
        intensity: optimizedIntensity,
        dayOfWeek: processDate.getDay(),
        weekIndex,
        month: MONTH_NAMES[processDate.getMonth()],
        dayOfMonth: processDate.getDate(),
        isToday: processDate.getTime() === today.getTime(),
        isCurrentMonth: processDate.getMonth() === today.getMonth() && 
                        processDate.getFullYear() === today.getFullYear(),
      });

      processDate.setDate(processDate.getDate() + 1);
      
      if (processDate.getDay() === 0) {
        weekIndex++;
      }
    }

    return days;
  }, [data, getUserActivityLevel]);

  // Group data by weeks for rendering
  const weeks = useMemo(() => {
    const weeksMap = new Map<number, DayData[]>();
    
    gridData.forEach(day => {
      if (!weeksMap.has(day.weekIndex)) {
        weeksMap.set(day.weekIndex, []);
      }
      weeksMap.get(day.weekIndex)!.push(day);
    });

    return Array.from(weeksMap.values()).map(week => {
      // Ensure each week has 7 days (fill missing days with empty data)
      const fullWeek = Array(7).fill(null).map((_, index) => {
        return week.find(day => day.dayOfWeek === index) || {
          date: '',
          count: 0,
          intensity: 0,
          dayOfWeek: index,
          weekIndex: week[0]?.weekIndex || 0,
          month: '',
          dayOfMonth: 0,
          isToday: false,
          isCurrentMonth: false,
        };
      });
      return fullWeek;
    });
  }, [gridData]);

  // Get month labels for display
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    const seenMonths = new Set<string>();
    
    weeks.forEach((week, index) => {
      const firstDay = week.find(day => day.date);
      if (firstDay && !seenMonths.has(firstDay.month)) {
        labels.push({ month: firstDay.month, weekIndex: index });
        seenMonths.add(firstDay.month);
      }
    });
    
    return labels;
  }, [weeks]);

  // Handle day click
  const handleDayClick = useCallback((day: DayData) => {
    if (!day.date) return;
    setSelectedDate(selectedDate === day.date ? null : day.date);
  }, [selectedDate]);

  // Handle day hover
  const handleDayHover = useCallback((day: DayData | null) => {
    setHoveredDate(day?.date || null);
  }, []);

  // Get tooltip content for a day
  const getTooltipContent = useCallback((day: DayData) => {
    if (!day.date) return null;
    
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Enhanced tooltip with stopwatch information
    const pomodoroSessions = (day as any).pomodoro_sessions || 0;
    const stopwatchTime = (day as any).stopwatch_time || 0;
    const totalTimeMinutes = (day as any).total_time_minutes || 0;
    
    let label = 'No activity';
    if (day.count > 0) {
      const parts = [];
      if (pomodoroSessions > 0) {
        parts.push(`${pomodoroSessions} Pomodoro session${pomodoroSessions !== 1 ? 's' : ''}`);
      }
      if (stopwatchTime > 0) {
        const stopwatchMinutes = Math.round(stopwatchTime / 60);
        parts.push(`${stopwatchMinutes}min stopwatch`);
      }
      label = parts.join(' + ');
    }

    return {
      date: formattedDate,
      count: day.count,
      intensity: day.intensity,
      label,
      pomodoroSessions,
      stopwatchTime,
      totalTimeMinutes,
    };
  }, []);

  // Calculate enhanced statistics with activity insights
  const stats = useMemo(() => {
    const totalDays = gridData.filter(d => d.date).length;
    const activeDays = gridData.filter(d => d.count > 0).length;
    const totalSessions = gridData.reduce((sum, d) => sum + d.count, 0);
    const averageSessions = totalSessions / Math.max(totalDays, 1);
    const maxDailySessions = Math.max(...gridData.map(d => d.count), 0);
    
    // Calculate stopwatch statistics
    const totalStopwatchTime = gridData.reduce((sum, d) => {
      const stopwatchTime = (d as any).stopwatch_time || 0;
      return sum + stopwatchTime;
    }, 0);
    const totalStopwatchMinutes = Math.round(totalStopwatchTime / 60);
    const totalStopwatchHours = Math.round(totalStopwatchMinutes / 60 * 10) / 10;
    
    // Calculate total focus time (Pomodoro + Stopwatch)
    const totalFocusTime = gridData.reduce((sum, d) => {
      const totalTimeMinutes = (d as any).total_time_minutes || 0;
      return sum + totalTimeMinutes;
    }, 0);
    const totalFocusHours = Math.round(totalFocusTime / 60 * 10) / 10;
    
    // Calculate activity consistency
    const consistency = activeDays / Math.max(totalDays, 1) * 100;
    
    // Calculate intensity distribution
    const intensityDistribution = INTENSITY_COLORS.map((_, level) => 
      gridData.filter(d => d.intensity === level).length
    );
    
    // Calculate recent activity (last 7 days)
    const recentDays = gridData.filter(d => {
      if (!d.date) return false;
      const date = new Date(d.date);
      const today = new Date();
      const daysDiff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    const recentSessions = recentDays.reduce((sum, d) => sum + d.count, 0);
    const recentStopwatchTime = recentDays.reduce((sum, d) => {
      const stopwatchTime = (d as any).stopwatch_time || 0;
      return sum + stopwatchTime;
    }, 0);
    const recentStopwatchMinutes = Math.round(recentStopwatchTime / 60);
    
    return {
      totalSessions: data.total_sessions,
      activeDays,
      totalDays,
      averageSessions: Math.round(averageSessions * 10) / 10,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      maxDailySessions,
      consistency: Math.round(consistency * 10) / 10,
      activityLevel: getUserActivityLevel,
      recentSessions,
      intensityDistribution,
      // New stopwatch statistics
      totalStopwatchMinutes,
      totalStopwatchHours,
      totalFocusTime,
      totalFocusHours,
      recentStopwatchMinutes,
    };
  }, [data, gridData, getUserActivityLevel]);

  const cellSize = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const gap = compact ? 'gap-0.5' : 'gap-1';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Enhanced Stats */}
      {showStats && (
        <div className="space-y-4">
          {/* Primary Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>{stats.totalSessions} sessions</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{stats.activeDays}/{stats.totalDays} days active</span>
              </div>
              <div className="flex items-center space-x-1">
                <Flame className="w-4 h-4" />
                <span>{stats.currentStreak} day streak</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{stats.averageSessions} avg/day</span>
              </div>
              {stats.totalStopwatchMinutes > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400">
                    {stats.totalStopwatchHours}h stopwatch
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Activity Level & Enhanced Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Activity Level</div>
              <div className={`font-semibold ${
                stats.activityLevel === 'expert' ? 'text-purple-600 dark:text-purple-400' :
                stats.activityLevel === 'high' ? 'text-green-600 dark:text-green-400' :
                stats.activityLevel === 'medium' ? 'text-blue-600 dark:text-blue-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {stats.activityLevel.charAt(0).toUpperCase() + stats.activityLevel.slice(1)}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consistency</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {stats.consistency}%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Day</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {stats.maxDailySessions} sessions
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Week</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {stats.recentSessions} sessions
              </div>
              {stats.recentStopwatchMinutes > 0 && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  +{stats.recentStopwatchMinutes}min stopwatch
                </div>
              )}
            </div>
            
            {stats.totalStopwatchMinutes > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Stopwatch Time</div>
                <div className="font-semibold text-orange-700 dark:text-orange-300">
                  {stats.totalStopwatchHours}h
                </div>
                <div className="text-xs text-orange-500 dark:text-orange-500 mt-1">
                  {stats.totalStopwatchMinutes} minutes
                </div>
              </div>
            )}
          </div>
          
          {/* Focus Time Summary */}
          {stats.totalFocusTime > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Total Focus Time</h4>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalFocusHours}h
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Pomodoro:</span>
                  <span className="ml-2 font-medium">{Math.round((stats.totalFocusTime - stats.totalStopwatchMinutes) / 60 * 10) / 10}h</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Stopwatch:</span>
                  <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">{stats.totalStopwatchHours}h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="relative">
        {/* Month Labels */}
        {!compact && (
          <div className="flex text-xs text-gray-500 dark:text-gray-400 mb-2">
            {monthLabels.map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="flex-shrink-0 text-center"
                style={{ 
                  marginLeft: `${weekIndex * (compact ? 14 : 16)}px`,
                  width: '24px'
                }}
              >
                {month}
              </div>
            ))}
          </div>
        )}

        <div className="flex">
          {/* Day Labels */}
          {!compact && (
            <div className={`flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2 ${cellSize}`}>
              {DAY_NAMES.filter((_, i) => i % 2 === 1).map(day => (
                <div key={day} className="h-3 flex items-center">
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Heatmap Grid */}
          <div className={`flex ${gap} overflow-x-auto scrollbar-thin`}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={`flex flex-col ${gap}`}>
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      ${cellSize} rounded-sm cursor-pointer border border-gray-200 dark:border-gray-600
                      ${day.date ? INTENSITY_COLORS[day.intensity] : 'bg-transparent border-transparent'}
                      ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                      ${selectedDate === day.date ? 'ring-2 ring-purple-500' : ''}
                      ${hoveredDate === day.date ? 'ring-1 ring-gray-400' : ''}
                      transition-all duration-150 hover:scale-110
                    `}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => handleDayHover(day)}
                    onMouseLeave={() => handleDayHover(null)}
                    title={day.date ? getTooltipContent(day)?.label : undefined}
                    aria-label={day.date ? `${getTooltipContent(day)?.date}: ${getTooltipContent(day)?.label}` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDate && (
          <div className="absolute z-10 bg-black text-white text-xs rounded-lg px-3 py-2 pointer-events-none transform -translate-y-full -translate-x-1/2 left-1/2 top-0">
            {(() => {
              const day = gridData.find(d => d.date === hoveredDate);
              if (!day) return null;
              const tooltip = getTooltipContent(day);
              return (
                <div className="whitespace-nowrap">
                  <div className="font-medium">{tooltip?.label}</div>
                  <div className="text-gray-300">{tooltip?.date}</div>
                </div>
              );
            })()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
          </div>
        )}
      </div>

      {/* Enhanced Legend */}
      {showLegend && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Less active</span>
            <div className={`flex ${gap}`}>
              {INTENSITY_COLORS.map((color, index) => (
                <div
                  key={index}
                  className={`${cellSize} ${color} rounded-sm border border-gray-200 dark:border-gray-600`}
                  title={`Intensity level ${index}: ${index === 0 ? 'No activity' : 
                    index === 1 ? 'Very low activity' :
                    index === 2 ? 'Low activity' :
                    index === 3 ? 'Medium activity' :
                    index === 4 ? 'High activity' :
                    index === 5 ? 'Very high activity' :
                    'Extremely high activity'}`}
                />
              ))}
            </div>
            <span>More active</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Optimized for {stats.activityLevel} activity level • Includes Pomodoro + Stopwatch time • Recent activity gets bonus intensity
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && (() => {
        const selectedDay = gridData.find(d => d.date === selectedDate);
        if (!selectedDay) return null;
        
        return (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h4>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Activity:</span>
                <span className="ml-2 font-medium">{selectedDay.count} sessions</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Intensity:</span>
                <span className="ml-2 font-medium">
                  {selectedDay.intensity === 0 ? 'None' :
                   selectedDay.intensity === 1 ? 'Low' :
                   selectedDay.intensity === 2 ? 'Medium' :
                   selectedDay.intensity === 3 ? 'High' :
                   selectedDay.intensity === 4 ? 'Very High' :
                   selectedDay.intensity === 5 ? 'Extreme' : 'Maximum'}
                </span>
              </div>
            </div>

            {/* Detailed breakdown */}
            {(() => {
              const pomodoroSessions = (selectedDay as any).pomodoro_sessions || 0;
              const stopwatchTime = (selectedDay as any).stopwatch_time || 0;
              const totalTimeMinutes = (selectedDay as any).total_time_minutes || 0;
              
              if (pomodoroSessions > 0 || stopwatchTime > 0) {
                return (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {pomodoroSessions > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Pomodoro:</span>
                          <span className="ml-2 font-medium">{pomodoroSessions} session{pomodoroSessions !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {stopwatchTime > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Stopwatch:</span>
                          <span className="ml-2 font-medium">{Math.round(stopwatchTime / 60)} minutes</span>
                        </div>
                      )}
                      {totalTimeMinutes > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-600 dark:text-gray-400">Total Focus Time:</span>
                          <span className="ml-2 font-medium">{totalTimeMinutes} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Intensity Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    selectedDay.intensity === 0 ? 'bg-gray-300' :
                    selectedDay.intensity === 1 ? 'bg-green-300' :
                    selectedDay.intensity === 2 ? 'bg-green-400' :
                    selectedDay.intensity === 3 ? 'bg-green-500' :
                    selectedDay.intensity === 4 ? 'bg-green-600' :
                    selectedDay.intensity === 5 ? 'bg-green-700' : 'bg-green-800'
                  }`}
                  style={{ width: `${(selectedDay.intensity / 6) * 100}%` }}
                />
              </div>
            </div>

            {selectedDay.count > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                {(() => {
                  const pomodoroSessions = (selectedDay as any).pomodoro_sessions || 0;
                  const stopwatchTime = (selectedDay as any).stopwatch_time || 0;
                  const totalTimeMinutes = (selectedDay as any).total_time_minutes || 0;
                  
                  if (totalTimeMinutes > 0) {
                    return `Total focus time: ${totalTimeMinutes} minutes`;
                  } else {
                    // Use actual work duration setting instead of hardcoded 25 minutes
                    const workDurationMinutes = settings?.work_duration ? Math.round(settings.work_duration / 60) : 25;
                    return `Estimated focus time: ~${selectedDay.count * workDurationMinutes} minutes`;
                  }
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {/* Summary Stats */}
      {!compact && (
        <div className={`grid gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${
          stats.totalStopwatchMinutes > 0 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'
        }`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalSessions}
            </div>
            <div className="text-sm text-gray-500">Total Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.currentStreak}
            </div>
            <div className="text-sm text-gray-500">Current Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.longestStreak}
            </div>
            <div className="text-sm text-gray-500">Longest Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((stats.activeDays / stats.totalDays) * 100)}%
            </div>
            <div className="text-sm text-gray-500">Active Days</div>
          </div>
          
          {stats.totalStopwatchMinutes > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.totalStopwatchHours}h
              </div>
              <div className="text-sm text-orange-500">Stopwatch Time</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for fetching heatmap data
export function useHeatmapData(startDate?: string, endDate?: string) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      const response = await fetch(`/api/stats/heatmap?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch heatmap data'));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Utility function to generate mock heatmap data for development
export function generateMockHeatmapData(days: number = 365): HeatmapResponse {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const data: HeatmapData[] = [];
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalSessions = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Generate semi-realistic activity pattern
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = date.toDateString() === endDate.toDateString();
    
    // Lower activity on weekends and random variation
    const baseActivity = isWeekend ? 0.3 : 0.7;
    const randomFactor = Math.random();
    const hasActivity = randomFactor < baseActivity;
    
    let count = 0;
    let intensity = 0;
    
    if (hasActivity) {
      count = Math.floor(Math.random() * 8) + 1; // 1-8 sessions
      intensity = Math.min(4, Math.floor(count / 2) + 1); // Intensity based on count
      totalSessions += count;
      tempStreak++;
      
      if (isToday || date < endDate) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    data.push({
      date: date.toISOString().split('T')[0],
      count,
      intensity,
    });
  }

  return {
    data,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    total_sessions: totalSessions,
    current_streak: currentStreak,
    longest_streak: longestStreak,
  };
}