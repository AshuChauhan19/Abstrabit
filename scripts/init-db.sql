-- Smart Bookmarks Database Schema
-- Copy and paste this into Supabase > SQL Editor if the seed script doesn't work

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

-- RLS Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks" 
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks" 
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own bookmarks
CREATE POLICY "Users can update their own bookmarks" 
  ON public.bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" 
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);
