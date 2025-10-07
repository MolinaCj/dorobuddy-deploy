#!/usr/bin/env node

/**
 * DoroBuddy Deployment Setup Script
 * 
 * This script helps you prepare your DoroBuddy app for deployment to Vercel
 * with Spotify integration.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 DoroBuddy Deployment Setup\n');

// Create environment variables template
const envTemplate = `# DoroBuddy Environment Variables
# Copy this file to .env.local for local development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback

# Optional: Encryption key for secure token storage
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64')}

# Optional: Rate limiting (if using Vercel KV)
# KV_REST_API_URL=your_vercel_kv_url
# KV_REST_API_TOKEN=your_vercel_kv_token
`;

// Create .env.example file
fs.writeFileSync('.env.example', envTemplate);
console.log('✅ Created .env.example file');

// Create deployment checklist
const checklist = `# DoroBuddy Deployment Checklist

## Pre-Deployment
- [ ] Git repository is set up and pushed to GitHub/GitLab
- [ ] Supabase project created with database tables
- [ ] Spotify app created in Spotify Developer Dashboard
- [ ] Environment variables documented

## Deployment Steps
- [ ] Connect repository to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Deploy to Vercel
- [ ] Update Spotify redirect URI with production URL
- [ ] Test Spotify integration
- [ ] Test PWA installation
- [ ] Test offline functionality

## Post-Deployment Testing
- [ ] User registration/login works
- [ ] Spotify connection works
- [ ] Timer functionality works
- [ ] Task management works
- [ ] PWA installs on mobile
- [ ] PWA installs on desktop
- [ ] Offline mode works
- [ ] Analytics tracking works

## Production URLs
- App URL: https://your-app.vercel.app
- Spotify Redirect: https://your-app.vercel.app/api/spotify/callback
- PWA Test: https://your-app.vercel.app/pwa-test

## Environment Variables for Vercel
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify/callback
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64')}
\`\`\`
`;

fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
console.log('✅ Created DEPLOYMENT_CHECKLIST.md');

// Create database setup SQL
const sqlSetup = `-- DoroBuddy Database Setup for Supabase
-- Run these commands in your Supabase SQL editor

-- Create spotify_tokens table
CREATE TABLE IF NOT EXISTS spotify_tokens (
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
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('focus', 'break', 'long_break')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for spotify_tokens
CREATE POLICY "Users can view own spotify_tokens" ON spotify_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spotify_tokens" ON spotify_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spotify_tokens" ON spotify_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spotify_tokens" ON spotify_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for sessions
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_spotify_tokens_updated_at 
  BEFORE UPDATE ON spotify_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

fs.writeFileSync('database-setup.sql', sqlSetup);
console.log('✅ Created database-setup.sql');

console.log('\n🎉 Setup complete! Next steps:');
console.log('1. Review the DEPLOYMENT.md guide');
console.log('2. Set up your Supabase project and run database-setup.sql');
console.log('3. Create your Spotify app');
console.log('4. Deploy to Vercel with the environment variables');
console.log('5. Update Spotify redirect URI with your production URL');
console.log('\nHappy coding! 🚀');
