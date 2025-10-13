import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    
    const { data: session, error } = await supabase
      .from('stopwatch_sessions')
      .select(`
        *,
        tasks (
          id,
          title
        )
      `)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Stopwatch session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in stopwatch GET by ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { duration_seconds, started_at, ended_at, notes } = body

    const resolvedParams = await params
    
    // Validate that the session exists and belongs to the user
    const { data: existingSession, error: fetchError } = await supabase
      .from('stopwatch_sessions')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Stopwatch session not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (duration_seconds !== undefined) {
      if (duration_seconds <= 0) {
        return NextResponse.json(
          { error: 'Duration must be positive' },
          { status: 400 }
        )
      }
      updateData.duration_seconds = duration_seconds
    }

    if (started_at !== undefined) {
      const startDate = new Date(started_at)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        )
      }
      updateData.started_at = startDate.toISOString()
    }

    if (ended_at !== undefined) {
      const endDate = new Date(ended_at)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        )
      }
      updateData.ended_at = endDate.toISOString()
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Validate that end time is after start time if both are provided
    if (updateData.started_at && updateData.ended_at) {
      const startDate = new Date(updateData.started_at)
      const endDate = new Date(updateData.ended_at)
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
    }

    // Update the session
    const { data: session, error: updateError } = await supabase
      .from('stopwatch_sessions')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select(`
        *,
        tasks (
          id,
          title
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating stopwatch session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update stopwatch session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in stopwatch PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    
    // Delete the session
    const { error } = await supabase
      .from('stopwatch_sessions')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting stopwatch session:', error)
      return NextResponse.json(
        { error: 'Failed to delete stopwatch session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Stopwatch session deleted successfully' })
  } catch (error) {
    console.error('Error in stopwatch DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
