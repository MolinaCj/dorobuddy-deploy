// src/app/api/settings/route.ts
import { createServerClient, getAuthenticatedUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

// GET /api/settings - Fetch user settings
export async function GET(request: Request) {
  try {
    console.log('🔧 [Settings API] Starting GET request')
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ [Settings API] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 503 }
      )
    }

    console.log('🔧 [Settings API] Getting authenticated user')
    const { user, error: authError } = await getAuthenticatedUser()
    
    if (authError || !user) {
      console.error('❌ [Settings API] Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()

    console.log('✅ [Settings API] User authenticated:', user.id)

    // Fetch user settings
    console.log('🔧 [Settings API] Fetching user settings from database')
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError) {
      console.log('⚠️ [Settings API] Settings fetch error:', settingsError.code, settingsError.message)
      
      // If no settings found, return default settings
      if (settingsError.code === 'PGRST116') {
        console.log('🔧 [Settings API] No settings found, creating default settings')
        const defaultSettings = {
          user_id: user.id,
          work_duration: 1500,
          short_break_duration: 300,
          long_break_duration: 1800,
          sessions_until_long_break: 4,
          auto_start_breaks: false,
          auto_start_pomodoros: false,
          theme: 'default',
          notification_sound: 'bell',
          break_sound: 'chime',
          master_volume: 0.7,
          notification_volume: 0.8,
          music_volume: 0.5,
          ambient_volume: 0.3,
          spotify_enabled: false,
        }

        // Create default settings in database
        console.log('🔧 [Settings API] Inserting default settings into database')
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert([defaultSettings])
          .select()
          .single()

        if (createError) {
          console.error('❌ [Settings API] Error creating default settings:', createError)
          console.log('🔧 [Settings API] Returning default settings without database storage')
          return NextResponse.json(defaultSettings)
        }

        console.log('✅ [Settings API] Default settings created successfully')
        return NextResponse.json(newSettings)
      }

      console.error('❌ [Settings API] Database error fetching settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    console.log('✅ [Settings API] Settings fetched successfully')
    return NextResponse.json(settings)
  } catch (error) {
    console.error('❌ [Settings API] Unexpected error in GET /api/settings:', error)
    console.error('❌ [Settings API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Parse request body
    const body = await request.json()

    // Validate and sanitize input
    const allowedFields = [
      'work_duration',
      'short_break_duration',
      'long_break_duration',
      'sessions_until_long_break',
      'auto_start_breaks',
      'auto_start_pomodoros',
      'theme',
      'notification_sound',
      'break_sound',
      'master_volume',
      'notification_volume',
      'music_volume',
      'ambient_volume',
      'spotify_enabled',
    ]

    const updates: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    // Only include allowed fields
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Validate numeric fields
    if (updates.work_duration !== undefined) {
      updates.work_duration = Math.max(60, Math.min(7200, updates.work_duration))
    }
    if (updates.short_break_duration !== undefined) {
      updates.short_break_duration = Math.max(60, Math.min(1800, updates.short_break_duration))
    }
    if (updates.long_break_duration !== undefined) {
      updates.long_break_duration = Math.max(300, Math.min(3600, updates.long_break_duration))
    }
    if (updates.sessions_until_long_break !== undefined) {
      updates.sessions_until_long_break = Math.max(2, Math.min(10, updates.sessions_until_long_break))
    }

    // Validate volume fields (0-1)
    const volumeFields = ['master_volume', 'notification_volume', 'music_volume', 'ambient_volume']
    for (const field of volumeFields) {
      if (updates[field] !== undefined) {
        updates[field] = Math.max(0, Math.min(1, updates[field]))
      }
    }

    // Update or insert settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_settings')
      .upsert(updates, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (updateError) {
      console.error('Error updating settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Unexpected error in PUT /api/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings - Reset settings to defaults
export async function DELETE(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Delete existing settings
    const { error: deleteError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting settings:', deleteError)
      return NextResponse.json(
        { error: 'Failed to reset settings' },
        { status: 500 }
      )
    }

    // Create default settings
    const defaultSettings = {
      user_id: user.id,
      work_duration: 1500,
      short_break_duration: 300,
      long_break_duration: 1800,
      sessions_until_long_break: 4,
      auto_start_breaks: false,
      auto_start_pomodoros: false,
      theme: 'default',
      notification_sound: 'bell',
      break_sound: 'chime',
      master_volume: 0.7,
      notification_volume: 0.8,
      music_volume: 0.5,
      ambient_volume: 0.3,
      spotify_enabled: false,
    }

    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert([defaultSettings])
      .select()
      .single()

    if (createError) {
      console.error('Error creating default settings:', createError)
      return NextResponse.json(
        { error: 'Failed to create default settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(newSettings)
  } catch (error) {
    console.error('Unexpected error in DELETE /api/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}