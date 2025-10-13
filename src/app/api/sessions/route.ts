import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, session_type, planned_duration, notes, actual_duration } = body;

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        task_id: task_id || null,
        session_type,
        planned_duration,
        actual_duration: actual_duration || planned_duration,
        notes: notes || null,
        completed: true,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('Session created successfully:', session);

    // Update daily_stats table
    const today = new Date().toISOString().split('T')[0];
    const sessionDuration = actual_duration || planned_duration;
    
    // Get current daily stats
    const { data: existingStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    console.log('Daily stats query result:', { existingStats, statsError, today, userId: user.id });

    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from('daily_stats')
        .update({
          total_sessions: existingStats.total_sessions + 1,
          completed_sessions: existingStats.completed_sessions + 1,
          total_work_time: session_type === 'work' 
            ? existingStats.total_work_time + sessionDuration 
            : existingStats.total_work_time,
          total_break_time: session_type !== 'work' 
            ? existingStats.total_break_time + sessionDuration 
            : existingStats.total_break_time,
          intensity_level: Math.min(4, Math.floor((existingStats.completed_sessions + 1) / 2) + 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);

      if (updateError) {
        console.error('Error updating daily stats:', updateError);
      } else {
        console.log('Daily stats updated successfully');
      }
    } else {
      // Create new daily stats
      const { error: insertError } = await supabase
        .from('daily_stats')
        .insert({
          user_id: user.id,
          date: today,
          total_sessions: 1,
          completed_sessions: 1,
          total_work_time: session_type === 'work' ? sessionDuration : 0,
          total_break_time: session_type !== 'work' ? sessionDuration : 0,
          tasks_completed: 0,
          intensity_level: 1
        });

      if (insertError) {
        console.error('Error creating daily stats:', insertError);
      } else {
        console.log('Daily stats created successfully');
      }
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
