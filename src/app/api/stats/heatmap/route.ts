import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Default to last year (365 or 366 days) if no dates provided
    // Use Philippine time (UTC+8) for date calculation
    const philippineTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const defaultEndDate = philippineTime;
    const defaultStartDate = new Date(philippineTime);
    
    // Calculate days in the current year (365 or 366 for leap year)
    const currentYear = philippineTime.getFullYear();
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    
    defaultStartDate.setDate(defaultEndDate.getDate() - daysInYear);

    const queryStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const queryEndDate = endDate || defaultEndDate.toISOString().split('T')[0];

    console.log(`Heatmap API: Querying daily stats from ${queryStartDate} to ${queryEndDate}`);

    // Get daily stats from the database
    const { data: dailyStats, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', queryStartDate)
      .lte('date', queryEndDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily stats:', error);
      return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 });
    }

    console.log(`Found ${dailyStats?.length || 0} daily stats for user ${user.id}`);
    console.log('Daily stats data:', dailyStats);

    // Convert daily stats to heatmap format, including stopwatch time
    const data = (dailyStats || []).map(stat => {
      // Calculate total activity time (Pomodoro + Stopwatch)
      const pomodoroTime = stat.total_work_time || 0; // in seconds
      const stopwatchTime = stat.total_stopwatch_time || 0; // in seconds
      const totalTimeMinutes = (pomodoroTime + stopwatchTime) / 60;
      
      // Enhanced intensity calculation that includes stopwatch time
      let enhancedIntensity = stat.intensity_level || 0;
      
      // Boost intensity if there's significant stopwatch time
      if (stopwatchTime > 0) {
        const stopwatchHours = stopwatchTime / 3600;
        if (stopwatchHours >= 2) {
          enhancedIntensity = Math.min(6, enhancedIntensity + 2); // Significant stopwatch time
        } else if (stopwatchHours >= 1) {
          enhancedIntensity = Math.min(6, enhancedIntensity + 1); // Moderate stopwatch time
        } else if (stopwatchHours >= 0.5) {
          enhancedIntensity = Math.min(6, enhancedIntensity + 0.5); // Some stopwatch time
        }
      }
      
      // Enhanced session count to include stopwatch activity
      let enhancedCount = stat.completed_sessions || 0;
      if (stopwatchTime > 0) {
        // Add "virtual sessions" based on stopwatch time (every 25 minutes = 1 session)
        const stopwatchSessions = Math.floor(stopwatchTime / 1500); // 1500 seconds = 25 minutes
        enhancedCount += stopwatchSessions;
      }
      
      return {
        date: stat.date,
        count: enhancedCount,
        intensity: Math.round(enhancedIntensity),
        // Additional data for detailed view
        pomodoro_sessions: stat.completed_sessions || 0,
        stopwatch_time: stopwatchTime,
        total_time_minutes: Math.round(totalTimeMinutes),
      };
    });

    // Calculate streaks
    const sortedDates = data.map(d => d.date).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const dayData = data.find(d => d.date === date);
      const hasActivity = (dayData?.count ?? 0) > 0;
      
      if (hasActivity) {
        tempStreak++;
        if (date === today || date < today) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    const totalSessions = data.reduce((sum, day) => sum + day.count, 0);

    return NextResponse.json({
      data,
      start_date: queryStartDate,
      end_date: queryEndDate,
      total_sessions: totalSessions,
      current_streak: currentStreak,
      longest_streak: longestStreak,
    });

  } catch (error) {
    console.error('Error in heatmap API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
