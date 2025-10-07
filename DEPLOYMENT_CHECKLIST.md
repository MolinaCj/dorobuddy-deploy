# DoroBuddy Deployment Checklist

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
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify/callback
ENCRYPTION_KEY=wSQS/53+EI2HO7H8ZvcexlLKgIGfGLx1trseHSffa2g=
```
