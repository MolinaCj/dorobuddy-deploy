# 🚀 DoroBuddy Deployment Guide for Vercel

This guide will help you deploy your DoroBuddy Pomodoro Timer app to Vercel with full Spotify integration.

## 📋 Prerequisites

- [Vercel account](https://vercel.com) (free tier available)
- [Supabase account](https://supabase.com) (free tier available)
- [Spotify Developer account](https://developer.spotify.com)
- Git repository (GitHub, GitLab, or Bitbucket)

## 🎯 Quick Answer: Spotify Setup

**Yes, you can set up Spotify integration before deploying to Vercel!** Here's how:

### Option 1: Use a Preview URL (Recommended)
1. Deploy to Vercel first (even with a basic setup)
2. Get your Vercel preview URL (e.g., `https://dorobuddy-abc123.vercel.app`)
3. Use this URL as your Spotify redirect URI
4. Test Spotify integration on the live preview

### Option 2: Use ngrok for Local Testing
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3000`
3. Use the ngrok URL (e.g., `https://abc123.ngrok.io`) as your Spotify redirect URI
4. Test locally with the ngrok URL

## 🛠️ Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub/GitLab/Bitbucket
git remote add origin https://github.com/yourusername/dorobuddy.git
git push -u origin main
```

### 2. Set Up Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Set Up Database Tables**
   ```sql
   -- Users table (handled by Supabase Auth)
   -- Create spotify_tokens table
   CREATE TABLE spotify_tokens (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     access_token TEXT NOT NULL,
     refresh_token TEXT NOT NULL,
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     scope TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create tasks table
   CREATE TABLE tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     completed BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create sessions table
   CREATE TABLE sessions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     duration INTEGER NOT NULL,
     type TEXT NOT NULL, -- 'focus', 'break', 'long_break'
     completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own spotify_tokens" ON spotify_tokens
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own spotify_tokens" ON spotify_tokens
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own spotify_tokens" ON spotify_tokens
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own tasks" ON tasks
     FOR ALL USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own sessions" ON sessions
     FOR ALL USING (auth.uid() = user_id);
   ```

### 3. Set Up Spotify App

1. **Create Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create App"
   - Fill in app details:
     - App name: `DoroBuddy`
     - App description: `Pomodoro Timer with Spotify Integration`
     - Website: `https://your-vercel-url.vercel.app`
     - Redirect URI: `https://your-vercel-url.vercel.app/api/spotify/callback`

2. **Get Spotify Credentials**
   - Copy your Client ID
   - Copy your Client Secret
   - Note: You'll update the redirect URI after deployment

### 4. Deploy to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select your DoroBuddy repository

2. **Configure Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables and add:

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Spotify
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=https://your-vercel-url.vercel.app/api/spotify/callback

   # Optional: Encryption key for tokens
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your production URL

### 5. Update Spotify Redirect URI

1. **Update Spotify App Settings**
   - Go back to Spotify Developer Dashboard
   - Edit your app settings
   - Update Redirect URI to: `https://your-actual-vercel-url.vercel.app/api/spotify/callback`
   - Save changes

2. **Update Vercel Environment Variables**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Update `SPOTIFY_REDIRECT_URI` with your actual Vercel URL
   - Redeploy if necessary

### 6. Test Your Deployment

1. **Visit Your App**
   - Go to your Vercel URL
   - Test user registration/login
   - Test Spotify connection
   - Test PWA installation

2. **Test PWA Features**
   - Visit `/pwa-test` to test PWA functionality
   - Try installing on mobile and desktop
   - Test offline functionality

## 🔧 Environment Variables Reference

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.vercel.app/api/spotify/callback

# Optional: Encryption
ENCRYPTION_KEY=your_32_character_key_for_token_encryption
```

### Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Copy the same variables as above
# Use localhost for development
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

## 🚨 Common Issues & Solutions

### Issue 1: Spotify Redirect URI Mismatch
**Error**: `redirect_uri_mismatch`

**Solution**: 
- Ensure redirect URI in Spotify dashboard matches exactly
- Check for trailing slashes
- Use HTTPS in production

### Issue 2: Supabase RLS Policies
**Error**: `new row violates row-level security policy`

**Solution**:
- Ensure RLS policies are set up correctly
- Check user authentication
- Verify user_id matches in database

### Issue 3: Environment Variables Not Loading
**Error**: `process.env.VARIABLE is undefined`

**Solution**:
- Check variable names (case-sensitive)
- Redeploy after adding new variables
- Use `NEXT_PUBLIC_` prefix for client-side variables

### Issue 4: PWA Not Installing
**Error**: Install prompt not showing

**Solution**:
- Check manifest.json is accessible
- Verify service worker is registered
- Test on HTTPS (required for PWA)

## 📱 PWA Testing Checklist

- [ ] App installs on mobile (iOS Safari, Android Chrome)
- [ ] App installs on desktop (Chrome, Edge, Safari)
- [ ] Offline functionality works
- [ ] Service worker caches resources
- [ ] Push notifications work (if implemented)
- [ ] App shortcuts work
- [ ] App opens in standalone mode

## 🔄 Continuous Deployment

Your app will automatically redeploy when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys
```

## 📊 Monitoring & Analytics

1. **Vercel Analytics**
   - Built-in performance monitoring
   - Real-time analytics
   - Error tracking

2. **Supabase Dashboard**
   - Database monitoring
   - User analytics
   - API usage

3. **Spotify Developer Dashboard**
   - API usage statistics
   - Rate limit monitoring

## 🎉 You're Done!

Your DoroBuddy app is now live with:
- ✅ Full Spotify integration
- ✅ PWA installation support
- ✅ Offline functionality
- ✅ User authentication
- ✅ Task management
- ✅ Productivity analytics

Share your app with the world! 🌍
