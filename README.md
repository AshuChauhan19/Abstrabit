# Smart Bookmarks

A simple, real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Google OAuth Authentication**: Sign in securely with your Google account
- **Add Bookmarks**: Save bookmarks with a title and URL
- **Private Bookmarks**: Your bookmarks are private and only visible to you
- **Real-time Sync**: Bookmarks update across tabs and devices in real-time
- **Delete Bookmarks**: Remove bookmarks you no longer need
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with Google OAuth
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A Vercel account (free tier works)
- A Google Cloud project for OAuth

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd abstrabit-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the following SQL to create the bookmarks table:

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

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create an OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
   - Add `http://localhost:3000` and `http://localhost:3000/auth/callback` as authorized redirect URIs
6. Get your Client ID and Secret

### 5. Configure Supabase OAuth

1. In your Supabase project, go to Authentication > Providers
2. Click on Google
3. Enable it and paste your Google Client ID
4. Copy your Supabase URL and Anon Key

### 6. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

### 1. Create a GitHub repository

1. Push your code to GitHub
2. Make sure the repo is public (as per requirements)

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Update your Google OAuth redirect URIs in Google Cloud Console to include your Vercel domain:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`

## Problems Encountered and Solutions

### Problem 1: CORS Issues with Supabase Realtime
**Issue**: Real-time updates were not working across different browser tabs.

**Solution**: 
- Ensured that we're using the Supabase SSR package (`@supabase/ssr`) for proper cookie-based session management
- Implemented the middleware to refresh the user session on each request
- Used the correct channel subscription pattern with proper schema and table references

### Problem 2: User Privacy and Row Level Security
**Issue**: Initially, users could potentially see other users' bookmarks if they knew the IDs.

**Solution**:
- Implemented Row Level Security (RLS) policies in Supabase
- Created policies to ensure users can only view, insert, and delete their own bookmarks
- All API routes verify user authentication before processing any request
- Backend always filters bookmarks by the authenticated user's ID

### Problem 3: Real-time Updates Across Tabs
**Issue**: Bookmarks added in one tab didn't automatically appear in another tab without refresh.

**Solution**:
- Implemented Supabase Realtime subscriptions using multi-user channels
- Subscribed to `postgres_changes` events on the bookmarks table
- Added logic to filter events by the current user's ID
- State updates are immediately applied when real-time events are received

### Problem 4: Google OAuth Redirect Configuration
**Issue**: OAuth callback was failing due to incorrect redirect URI configuration.

**Solution**:
- Set up the auth callback route properly at `/auth/callback`
- Used the correct `exchangeCodeForSession` method from Supabase
- Configured authorized redirect URIs in Google Cloud for both development (localhost) and production (Vercel)
- Ensured the callback route properly exchanges the code and redirects to the bookmarks page

### Problem 5: Session Management in Next.js App Router
**Issue**: Session was not persisting across page reloads in some cases.

**Solution**:
- Implemented middleware to refresh user session on every request
- Used the `updateSession` function within middleware to refresh auth state
- Properly handled cookie management using `@supabase/ssr`
- Made sure the layout component validates user session before rendering

### Problem 6: TypeScript Types and Supabase Clients
**Issue**: Type mismatches between server and client Supabase clients.

**Solution**:
- Created separate client utilities for server (`server.ts`) and browser (`client.ts`)
- Used proper Supabase SSR types
- Exported and imported clients correctly based on context
- Ensured proper async/await handling in server components

## Usage

1. **Sign In**: Click "Sign In with Google" and authenticate with your Google account
2. **Add Bookmark**: Fill in the bookmark title and URL, then click "Add Bookmark"
3. **View Bookmarks**: Your bookmarks will appear immediately on the page
4. **Delete Bookmark**: Click the "Delete" button next to any bookmark to remove it
5. **Real-time Sync**: Open your app in multiple tabs to see real-time updates

## API Routes

### GET /api/bookmarks
Get all bookmarks for the authenticated user.

**Response**: Array of bookmark objects

### POST /api/bookmarks
Create a new bookmark.

**Request Body**:
```json
{
  "title": "string",
  "url": "string"
}
```

**Response**: Created bookmark object

### DELETE /api/bookmarks?id=<bookmark_id>
Delete a specific bookmark.

**Response**: Success message

## Security Considerations

- All API routes require authentication
- Bookmarks are filtered by user ID on the backend
- Row Level Security is enabled on the database
- Google OAuth prevents unauthorized access
- URLs are validated as proper URLs before storage

## License

MIT
