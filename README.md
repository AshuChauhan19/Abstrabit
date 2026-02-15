# Smart Bookmarks

A real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS.

## Live Links

- Live App: https://abstrabit-one.vercel.app
- GitHub Repo: https://github.com/AshuChauhan19/Abstrabit

## Features

- Google OAuth login
- Add and delete bookmarks
- Private, user-scoped data (RLS)
- Real-time sync (Supabase Realtime)
- Cross-tab sync (BroadcastChannel)
- Responsive UI

## Tech Stack

- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Backend: Next.js Route Handlers (`/api/*`)
- Auth: Supabase Auth (Google OAuth)
- Database: Supabase Postgres
- Realtime: Supabase Realtime
- Deployment: Vercel

## Prerequisites

- Node.js 18+ and npm
- Supabase project
- Google Cloud OAuth credentials
- Vercel account

## Local Setup

1. Clone and install

```bash
git clone https://github.com/AshuChauhan19/Abstrabit.git
cd Abstrabit
npm install
```

2. Create `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run dev server

```bash
npm run dev
```

4. Open: `http://localhost:3000`

## Supabase Database Setup

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
```

## Google OAuth Setup

### In Google Cloud Console

- Create OAuth client (Web Application)
- Add origins:
  - `http://localhost:3000`
  - `https://abstrabit-one.vercel.app`
- Add redirect URIs:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback` (required for Supabase provider flow)

### In Supabase

- Authentication -> Providers -> Google -> Enable
- Add Google client ID and secret

## Supabase Auth URL Configuration (Important)

In Supabase -> Authentication -> URL Configuration:

- Site URL:
  - `https://abstrabit-one.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://abstrabit-one.vercel.app/auth/callback`

This avoids production redirects back to localhost.

## Deploy on Vercel

1. Import GitHub repo in Vercel
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Build Fix Note (Vercel)

`tsconfig.json` excludes `scripts/` to prevent build failures from local seed tooling.

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run lint
- `npm run seed` - run seed script locally

## API Routes

- `GET /api/bookmarks` - list current user bookmarks
- `POST /api/bookmarks` - create bookmark
- `DELETE /api/bookmarks?id=<id>` - delete bookmark

## Security

- Auth required for all bookmark operations
- Server-side user validation in API routes
- Row Level Security enforced in database
- User data isolated by `user_id`

## License

MIT
