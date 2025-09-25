import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get access token
    const tokenResponse = await fetch(`${request.nextUrl.origin}/api/spotify/token`)
    const { access_token } = await tokenResponse.json()

    if (!access_token) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    // Call Spotify API
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (spotifyResponse.ok) {
      return NextResponse.json({ success: true })
    } else {
      const error = await spotifyResponse.text()
      return NextResponse.json({ error }, { status: spotifyResponse.status })
    }
  } catch (error) {
    console.error('Spotify play error:', error)
    return NextResponse.json({ error: 'Failed to play' }, { status: 500 })
  }
}