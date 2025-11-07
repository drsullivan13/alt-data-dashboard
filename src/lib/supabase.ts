// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types for your data
export interface StockMetric {
  ticker: string
  date: string
  price: number | null
  job_posts: number | null
  reddit_mentions: number | null
  twitter_mentions: number | null
  reddit_sentiment: number | null
  employees_linkedin: number | null
  ai_score_employment: number | null
  // Add other fields as needed
}