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

    // Use Philippine time (UTC+8) for date calculation
    const philippineTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const today = philippineTime.toISOString().split('T')[0];

    // If no dates provided, default to today
    const queryStartDate = startDate || today;
    const queryEndDate = endDate || today;

    console.log(`Daily Stats API: Querying daily stats from ${queryStartDate} to ${queryEndDate}`);

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

    return NextResponse.json(dailyStats || []);
  } catch (error) {
    console.error('Error in daily stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
