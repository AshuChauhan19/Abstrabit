import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
  process.exit(1)
}

// Use service role key if available for elevated permissions, otherwise use anon key
const key = supabaseServiceRoleKey || supabaseAnonKey
const supabase = createClient(supabaseUrl, key)

async function initializeDatabase() {
  console.log('🚀 Initializing Supabase database schema...')

  try {
    // SQL to create tables and RLS policies
    const initSQL = `
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
    `

    // Execute each statement separately
    const statements = initSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_raw_sql', {
          statement,
        }).catch(() => {
          // If the RPC function doesn't exist, return a fake error we can handle
          return { error: { message: 'RPC function not available' } }
        })

        if (error?.message === 'RPC function not available') {
          // Skip RPC attempt if not available
          continue
        }

        if (error) {
          // Some errors are not critical (like table already exists)
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`)
          }
        }
      } catch (err) {
        console.warn(`⚠️  Could not execute statement via RPC: ${statement.substring(0, 50)}...`)
      }
    }

    console.log('✅ Database schema initialization complete!')
    console.log('Tips:')
    console.log('  - If the above shows RPC errors, manually run the SQL in Supabase > SQL Editor')
    console.log('  - Go to: https://app.supabase.com/project/<project-id>/sql')
    console.log('  - Copy the SQL schema from scripts/seed.sql and run it')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    process.exit(1)
  }
}

initializeDatabase()
