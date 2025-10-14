import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { task_id, duration_seconds, started_at, ended_at, notes } = body

    // Validate required fields
    if (!duration_seconds || !started_at || !ended_at) {
      return NextResponse.json(
        { error: 'Missing required fields: duration_seconds, started_at, ended_at' },
        { status: 400 }
      )
    }

    // Validate duration is positive
    if (duration_seconds <= 0) {
      return NextResponse.json(
        { error: 'Duration must be positive' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(started_at)
    const endDate = new Date(ended_at)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // If task_id is provided, verify it belongs to the user
    if (task_id) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', task_id)
        .eq('user_id', user.id)
        .single()

      if (taskError || !task) {
        return NextResponse.json(
          { error: 'Task not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Insert the stopwatch session
    const { data: session, error: insertError } = await supabase
      .from('stopwatch_sessions')
      .insert({
        user_id: user.id,
        task_id: task_id || null,
        duration_seconds,
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
        notes: notes || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting stopwatch session:', insertError)
      return NextResponse.json(
        { error: 'Failed to save stopwatch session' },
        { status: 500 }
      )
    }

    console.log('Stopwatch session created successfully:', session);

    // Update daily_stats table with stopwatch time
    const today = new Date().toISOString().split('T')[0];
    
    // Get current daily stats
    const { data: existingStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    console.log('Existing daily stats for today:', existingStats);

    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from('daily_stats')
        .update({
          total_stopwatch_time: (existingStats.total_stopwatch_time || 0) + duration_seconds,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('date', today);

      if (updateError) {
        console.error('Error updating daily stats:', updateError);
      } else {
        console.log('Daily stats updated with stopwatch time');
      }
    } else {
      // Create new daily stats
      const { error: insertError } = await supabase
        .from('daily_stats')
        .insert({
          user_id: user.id,
          date: today,
          total_sessions: 0,
          completed_sessions: 0,
          total_work_time: 0,
          total_break_time: 0,
          total_stopwatch_time: duration_seconds,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating daily stats:', insertError);
      } else {
        console.log('New daily stats created with stopwatch time');
      }
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error in stopwatch POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const task_id = searchParams.get('task_id')

    // Build query
    let query = supabase
      .from('stopwatch_sessions')
      .select(`
        *,
        tasks (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    // Apply filters
    if (start_date) {
      query = query.gte('started_at', start_date)
    }
    if (end_date) {
      query = query.lte('started_at', end_date)
    }
    if (task_id) {
      query = query.eq('task_id', task_id)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: sessions, error, count } = await query

    if (error) {
      console.error('Error fetching stopwatch sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stopwatch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in stopwatch GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
