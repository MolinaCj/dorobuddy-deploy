import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Spotify OAuth error:', error);
      return NextResponse.redirect(new URL('/?spotify_error=' + error, request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/?spotify_error=no_code', request.url));
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/?spotify_error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/?spotify_error=unauthorized', request.url));
    }

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('spotify_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope: tokens.scope,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(new URL('/?spotify_error=database_error', request.url));
    }

    // Redirect back to the app with success
    return NextResponse.redirect(new URL('/?spotify_connected=true', request.url));
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(new URL('/?spotify_error=callback_error', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });

    const tokens = await tokenResponse.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Store tokens (you'll need to implement encryption)
    const { error } = await supabase
      .from('spotify_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token, // Should be encrypted
        refresh_token: tokens.refresh_token, // Should be encrypted
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope: tokens.scope,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}