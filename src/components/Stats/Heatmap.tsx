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
        // Preserve additional data from API
        pomodoro_sessions: dayData?.pomodoro_sessions || 0,
        stopwatch_time: dayData?.stopwatch_time || 0,
        total_time_minutes: dayData?.total_time_minutes || 0,
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
    // Only count days that are within the actual date range (not the extended week range)
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    // Set time to start/end of day to ensure proper comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const totalDays = gridData.filter(d => {
      if (!d.date) return false;
      const dayDate = new Date(d.date);
      dayDate.setHours(12, 0, 0, 0); // Set to noon for consistent comparison
      return dayDate >= startDate && dayDate <= endDate;
    }).length;
    const activeDays = gridData.filter(d => {
      if (!d.date || d.count === 0) return false;
      const dayDate = new Date(d.date);
      dayDate.setHours(12, 0, 0, 0); // Set to noon for consistent comparison
      return dayDate >= startDate && dayDate <= endDate;
    }).length;
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
    
    // Calculate average stopwatch hours per day
    const stopwatchActiveDays = gridData.filter(d => {
      const stopwatchTime = (d as any).stopwatch_time || 0;
      return stopwatchTime > 0;
    }).length;
    const averageStopwatchHoursPerDay = stopwatchActiveDays > 0 
      ? Math.round((totalStopwatchHours / stopwatchActiveDays) * 10) / 10 
      : 0;
    
    // Calculate total focus time (Pomodoro + Stopwatch)
    const totalFocusTime = gridData.reduce((sum, d) => {
      const totalTimeMinutes = (d as any).total_time_minutes || 0;
      return sum + totalTimeMinutes;
    }, 0);
    const totalFocusHours = Math.round(totalFocusTime / 60 * 10) / 10;
    
    // Calculate average total focus hours per day (Pomodoro + Stopwatch)
    const totalActiveDays = gridData.filter(d => {
      const totalTimeMinutes = (d as any).total_time_minutes || 0;
      return totalTimeMinutes > 0;
    }).length;
    const averageTotalFocusHoursPerDay = totalActiveDays > 0 
      ? Math.round((totalFocusHours / totalActiveDays) * 10) / 10 
      : 0;
    
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
      averageStopwatchHoursPerDay,
      averageTotalFocusHoursPerDay,
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
          {/* Primary Stats - Mobile Responsive */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <Target className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{stats.totalSessions} sessions</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{stats.activeDays}/{stats.totalDays} days active</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <Flame className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{stats.currentStreak} day streak</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{stats.averageSessions} sessions/day</span>
            </div>
            {stats.averageTotalFocusHoursPerDay > 0 && (
              <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{stats.averageTotalFocusHoursPerDay}h/day</span>
              </div>
            )}
          </div>
          
          {/* Activity Level & Enhanced Metrics - Mobile Responsive */}
          <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-w-[140px] flex-1">
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
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-w-[140px] flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consistency</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {stats.consistency}%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-w-[140px] flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Day</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {stats.maxDailySessions} sessions
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-w-[140px] flex-1">
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
            
          </div>
          
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

      {/* Summary Stats - Mobile Responsive */}
      {!compact && (
        <div className={`grid gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${
          stats.totalStopwatchMinutes > 0 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  // Retry function with exponential backoff
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isServerError = error instanceof Error && (
          error.message.includes('503') || 
          error.message.includes('Service Unavailable') ||
          error.message.includes('Failed to fetch')
        );

        if (isLastAttempt || !isServerError) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (isFetching) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      // Skip fetch if data was fetched recently (within 30 seconds) unless forced
      const now = Date.now();
      if (!forceRefresh && data && (now - lastFetchTime) < 30000) {
        console.log('Skipping heatmap fetch - data is recent');
        return;
      }

      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      // Add timestamp to prevent caching
      queryParams.append('_t', now.toString());
      
      console.log('Fetching heatmap data...');
      
      const result = await retryWithBackoff(async () => {
        const response = await fetch(`/api/stats/heatmap?${queryParams}`, {
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
      });
      
      setData(result);
      setLastFetchTime(now);
      setConsecutiveErrors(0); // Reset error count on success
      console.log('Heatmap data updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch heatmap data';
      setError(new Error(errorMessage));
      setConsecutiveErrors(prev => prev + 1);
      console.error('Error fetching heatmap data:', err);
      
      // If we have existing data, don't clear it on error
      if (!data) {
        console.log('No existing data, showing error state');
      } else {
        console.log('Keeping existing data despite fetch error');
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [startDate, endDate, data, lastFetchTime, isFetching]);

  // Initial fetch
  React.useEffect(() => {
    fetchData(true); // Force initial fetch
  }, [startDate, endDate]);

  // Auto-refresh on window focus (when user switches back to tab/device)
  React.useEffect(() => {
    const handleFocus = () => {
      // Skip auto-refresh if there are consecutive errors (reduce server load)
      if (consecutiveErrors >= 2) {
        console.log('Skipping auto-refresh due to consecutive errors');
        return;
      }
      console.log('Window focused - refreshing heatmap data');
      fetchData(false); // Don't force, respect the 30-second cooldown
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Skip auto-refresh if there are consecutive errors (reduce server load)
        if (consecutiveErrors >= 2) {
          console.log('Skipping auto-refresh due to consecutive errors');
          return;
        }
        console.log('Page became visible - refreshing heatmap data');
        fetchData(false); // Don't force, respect the 30-second cooldown
      }
    };

    // Listen for window focus and visibility changes
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, consecutiveErrors]);

  // Periodic refresh every 2 minutes when tab is active
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        // Skip periodic refresh if there are consecutive errors (reduce server load)
        if (consecutiveErrors >= 2) {
          console.log('Skipping periodic refresh due to consecutive errors');
          return;
        }
        console.log('Periodic refresh - updating heatmap data');
        fetchData(false); // Don't force, respect the 30-second cooldown
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchData, consecutiveErrors]);

  // Listen for storage events (cross-tab communication)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Listen for heatmap data updates from other tabs/devices
      if (e.key === 'heatmap-data-updated' && e.newValue) {
        console.log('Heatmap data updated in another tab - refreshing');
        fetchData(false); // Don't force, respect the 30-second cooldown
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchData]);

  // Detect when user returns to the app after being away (cross-device sync)
  React.useEffect(() => {
    let lastActiveTime = Date.now();
    
    const updateLastActiveTime = () => {
      lastActiveTime = Date.now();
    };

    const checkForUpdates = () => {
      const timeSinceLastActive = Date.now() - lastActiveTime;
      // If user was away for more than 30 seconds, refresh data when they return
      if (timeSinceLastActive > 30000) {
        console.log('User returned after being away - refreshing heatmap data');
        fetchData(false); // Don't force, respect the 30-second cooldown
      }
      updateLastActiveTime();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateLastActiveTime, true);
    });

    // Check for updates when user becomes active
    document.addEventListener('visibilitychange', checkForUpdates);
    window.addEventListener('focus', checkForUpdates);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActiveTime, true);
      });
      document.removeEventListener('visibilitychange', checkForUpdates);
      window.removeEventListener('focus', checkForUpdates);
    };
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(true), // Force refresh when manually called
    isFetching // Expose fetching state for UI
  };
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