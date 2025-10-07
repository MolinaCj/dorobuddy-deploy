# 🎵 Spotify Integration Setup Guide

## Quick Answer: Can you set up Spotify before deploying?

**YES!** Here are your options:

### Option 1: Deploy First, Then Configure Spotify (Recommended)
1. Deploy your app to Vercel (even with basic setup)
2. Get your production URL: `https://your-app.vercel.app`
3. Use this URL in Spotify Developer Dashboard
4. Test Spotify integration on the live app

### Option 2: Use ngrok for Local Testing
1. Install ngrok: `npm install -g ngrok`
2. Start your app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok URL (e.g., `https://abc123.ngrok.io`) as your Spotify redirect URI
5. Test locally with the ngrok URL

### Option 3: Use Vercel Preview URLs
1. Deploy to Vercel (even with basic setup)
2. Use Vercel's preview URL for Spotify setup
3. Update to production URL later

## 🎯 Step-by-Step Spotify Setup

### 1. Create Spotify App

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Create New App**
   - Click "Create App"
   - Fill in the details:
     ```
     App name: DoroBuddy
     App description: Pomodoro Timer with Spotify Integration
     Website: https://your-app.vercel.app (or your ngrok URL)
     Redirect URI: https://your-app.vercel.app/api/spotify/callback
     ```

3. **Get Your Credentials**
   - Copy your **Client ID**
   - Copy your **Client Secret**
   - Save these for your environment variables

### 2. Configure Redirect URIs

**For Development:**
```
http://localhost:3000/api/spotify/callback
```

**For Production:**
```
https://your-app.vercel.app/api/spotify/callback
```

**For ngrok Testing:**
```
https://abc123.ngrok.io/api/spotify/callback
```

### 3. Environment Variables

Add these to your `.env.local` (development) and Vercel dashboard (production):

```bash
# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback  # For development
# SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify/callback  # For production
```

### 4. Test Spotify Integration

1. **Start your app**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Try connecting to Spotify**
4. **Check the browser console** for any errors

## 🔧 Troubleshooting Spotify Issues

### Issue: "redirect_uri_mismatch"
**Solution**: 
- Ensure the redirect URI in Spotify dashboard matches exactly
- Check for trailing slashes
- Use HTTPS in production

### Issue: "invalid_client"
**Solution**:
- Check your Client ID and Client Secret
- Ensure they're copied correctly (no extra spaces)

### Issue: "access_denied"
**Solution**:
- User denied permission
- Check your Spotify app permissions
- Ensure you're requesting the right scopes

### Issue: CORS errors
**Solution**:
- Spotify API calls should be made from your backend
- Don't call Spotify API directly from frontend
- Use your `/api/spotify/*` endpoints

## 📱 Testing on Mobile

1. **Use ngrok for mobile testing**:
   ```bash
   ngrok http 3000
   ```

2. **Update Spotify redirect URI** to your ngrok URL

3. **Test on your phone**:
   - Open the ngrok URL on your phone
   - Try connecting to Spotify
   - Test the PWA installation

## 🚀 Production Deployment

1. **Deploy to Vercel** (even with basic setup)
2. **Get your production URL**
3. **Update Spotify redirect URI** in Spotify Developer Dashboard
4. **Update environment variables** in Vercel dashboard
5. **Test the live app**

## ✅ Spotify Integration Checklist

- [ ] Spotify app created in Developer Dashboard
- [ ] Client ID and Client Secret obtained
- [ ] Redirect URI configured correctly
- [ ] Environment variables set up
- [ ] Spotify connection tested locally
- [ ] Spotify connection tested in production
- [ ] Mobile testing completed
- [ ] PWA installation tested with Spotify

## 🎉 You're Ready!

Once Spotify is configured, your users will be able to:
- Connect their Spotify accounts
- Control music playback during Pomodoro sessions
- Use their playlists and saved tracks
- Enjoy seamless music integration with their productivity workflow

Happy coding! 🎵🚀
