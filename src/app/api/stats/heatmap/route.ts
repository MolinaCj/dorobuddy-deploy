import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Default to last 365 days if no dates provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultEndDate.getDate() - 365);

    const queryStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const queryEndDate = endDate || defaultEndDate.toISOString().split('T')[0];

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

    // Convert daily stats to heatmap format
    const data = (dailyStats || []).map(stat => ({
      date: stat.date,
      count: stat.completed_sessions,
      intensity: stat.intensity_level,
    }));

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
