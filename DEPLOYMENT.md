# Deployment Guide for Smart Bookmarks

## Overview

The Smart Bookmarks app is ready to be deployed to Vercel. This guide walks through the necessary steps to get the app live.

## Prerequisites

You will need:
- A GitHub account
- A Supabase account (free tier)
- A Google Cloud project with OAuth configured
- A Vercel account

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface (Recommended)

1. Go to [GitHub](https://github.com/new)
2. Create a new repository with the name `smart-bookmarks` (or your preferred name)
3. Make it **Public** (as per requirements)
4. Do NOT initialize with README (we already have one)
5. Click "Create repository"

### Option B: Using GitHub CLI

```bash
gh repo create smart-bookmarks --public --source=. --remote=origin --push
```

### Option C: Manual Git Push

After creating the repo on GitHub:

```bash
cd d:\Professional\Job Assignments\Abstrabit\abstrabit-app
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-bookmarks.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [Supabase](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `smart-bookmarks`
5. Create a strong database password
6. Choose your region (closest to you)
7. Click "Create new project" and wait for it to finish

### 2.2 Create Database Table

Once your project is ready:

1. Go to "SQL Editor" in the sidebar
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Create the bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_bookmark UNIQUE(user_id, url)
);

-- Create an index for faster queries
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create a policy so users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a policy so users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a policy so users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for bookmarks table
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

4. Click "Run"
5. You should see "Success" messages

### 2.3 Get Your Supabase Credentials

1. Go to "Project Settings" (gear icon)
2. Click on "API"
3. You'll see:
   - **Project URL** - Copy this
   - **Anon (public) Key** - Copy this

Save these values for later use.

### 2.4 Enable Google OAuth

1. In your Supabase project, go to "Authentication" → "Providers"
2. Click on "Google"
3. Toggle "Enable Google provider"
4. You'll need your Google Client ID (see Step 3 below)
5. Save the provider settings

## Step 3: Set Up Google OAuth

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter name: `Smart Bookmarks`
5. Click "CREATE"
6. Wait for the project to be created

### 3.2 Enable Google+ API

1. In the search bar at the top, search for "Google+ API"
2. Click on "Google+ API" result
3. Click "ENABLE"
4. Wait for it to be enabled

### 3.3 Create OAuth 2.0 Credentials

1. Go to "Credentials" in the left sidebar
2. Click "CREATE CREDENTIALS"
3. Choose "OAuth client ID"
4. If prompted to create an OAuth consent screen:
   - Click "CREATE OAUTH CONSENT SCREEN"
   - Choose "External"
   - Click "CREATE"
5. Fill in the OAuth consent screen:
   - App name: `Smart Bookmarks`
   - User support email: Your email
   - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
6. Skip optional scopes and go to "SAVE AND CONTINUE"
7. Go back to create credentials

### 3.4 Add Authorized Redirect URIs

1. Go back to "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `Smart Bookmarks`
5. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://YOUR_VERCEL_DOMAIN.vercel.app/auth/callback` (you'll add this after deploy)
6. Click "CREATE"
7. A popup shows your credentials - save the **Client ID**

### 3.5 Add Client ID to Supabase

1. Go back to your Supabase project
2. Authentication → Providers → Google
3. Paste your Google Client ID
4. Click "Save"

## Step 4: Deploy to Vercel

### 4.1 Connect to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Paste your GitHub repository URL
5. Click "Continue"

### 4.2 Configure Environment Variables

1. Under "Environment Variables", add:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
     Value: `<Your Supabase Project URL>`
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     Value: `<Your Supabase Anon Key>`
2. Click "Deploy"

### 4.3 Wait for Deployment

- Vercel will build and deploy your app
- You'll get a domain like `https://smart-bookmarks-xyz.vercel.app`
- Copy this URL

### 4.4 Update Google OAuth URLs

Now that you have your Vercel URL:

1. Go back to Google Cloud Console
2. Go to Credentials → OAuth 2.0 Client ID
3. Edit the client
4. Add to "Authorized redirect URIs":
   - `https://YOUR_VERCEL_DOMAIN.vercel.app/auth/callback`
5. Click "Save"

## Step 5: Test the App

1. Go to your Vercel URL
2. Click "Sign In with Google"
3. Authenticate with your Google account
4. You should be redirected to the bookmarks page
5. Try adding a bookmark
6. Open the app in a new tab to verify real-time sync

## Troubleshooting

### Error: "Unauthorized" when accessing bookmarks

**Solution**: Make sure you've created the `bookmarks` table in Supabase and enabled RLS policies.

### Google Sign-In Not Working

**Solution**: 
- Check that your redirect URI in Google Cloud matches your deployment URL
- Verify the Google Client ID is correct in Supabase
- Clear browser cookies and try again

### Real-time Updates Not Working

**Solution**:
- Make sure you've enabled Realtime for the `bookmarks` table in Supabase
- Check that Row Level Security policies are correctly configured
- Verify your Supabase credentials are in `.env.local` (development) or Vercel environment variables (production)

### Build Fails on Vercel

**Solution**:
- Check the Vercel build logs for specific errors
- Make sure all dependencies are installed locally and the build succeeds
- Verify `.env.local` environment variables are set in Vercel

## Going Further

### Local Development

To develop locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Deployment Updates

After making changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

Vercel automatically redeploys when you push to main.

## Support

For issues or questions, check the README.md in the project root or open an issue on GitHub.
