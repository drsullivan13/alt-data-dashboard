-- ============================================
-- Email Notification Setup - Database Trigger
-- ============================================
-- This automatically sends approval emails when new users sign up
-- No Edge Functions needed, no SMTP configuration required!

-- Step 1: Enable pg_net extension (if not already enabled)
-- Run this in Supabase Dashboard → SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Create function to call your API endpoint
CREATE OR REPLACE FUNCTION notify_admin_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Make HTTP POST request to your Next.js API
  SELECT net.http_post(
    url := 'https://your-vercel-app.vercel.app/api/notify-admin',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'user', json_build_object(
        'id', NEW.id,
        'email', NEW.email
      )
    )::jsonb,
    timeout_milliseconds := 5000
  ) INTO request_id;
  
  -- Log the request for debugging
  RAISE NOTICE 'Notification sent for user % (request_id: %)', NEW.email, request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on user_profiles table
-- This fires when email is confirmed (email_verified changes to true)
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
DROP TRIGGER IF EXISTS on_user_email_confirmed ON user_profiles;

CREATE TRIGGER on_user_email_confirmed
AFTER UPDATE ON user_profiles
FOR EACH ROW
WHEN (
  OLD.email_verified = false 
  AND NEW.email_verified = true 
  AND NEW.approved = false
) -- Only notify when email is confirmed and user not yet approved
EXECUTE FUNCTION notify_admin_on_signup();

-- ============================================
-- How to Use:
-- ============================================
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. Update the URL to your actual Vercel deployment URL
-- 5. Test by creating a new user account!

-- ============================================
-- How it Works:
-- ============================================
-- 1. User signs up → user_profiles row created with approved=false, email_verified=false
-- 2. User clicks email confirmation link → email_verified changes to true
-- 3. Trigger fires → calls notify_admin_on_signup()
-- 4. Function makes HTTP POST to /api/notify-admin
-- 5. Your Next.js API sends the email (using Edge Function)
-- 6. You receive approval email with link!

-- ============================================
-- Important: Email Verified Column
-- ============================================
-- Make sure your user_profiles table has an email_verified column.
-- If not, you need to add it and sync it from auth.users:

-- Add email_verified column if missing:
-- ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Option 1: Update existing profiles to sync email_verified from auth.users
-- UPDATE user_profiles 
-- SET email_verified = (
--   SELECT COALESCE((raw_user_meta_data->>'email_verified')::boolean, false)
--   FROM auth.users 
--   WHERE auth.users.id = user_profiles.id
-- );

-- Option 2: Create a trigger to keep email_verified in sync
-- This ensures email_verified in user_profiles always matches auth.users
-- (Add this if needed - see documentation)

-- ============================================
-- Testing:
-- ============================================
-- After running this SQL, test with:
-- 1. Go to your app and sign up with a new account
-- 2. Check Supabase logs: Dashboard → Logs → Search for "Notification sent"
-- 3. Check your email inbox for approval notification

-- ============================================
-- Debugging:
-- ============================================
-- View recent HTTP requests:
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;

-- View trigger status:
SELECT * FROM pg_trigger WHERE tgname = 'on_user_email_confirmed';

-- Check if email_verified column exists:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'email_verified';

-- Manually test the function:
-- SELECT notify_admin_on_signup();

-- Disable trigger temporarily (for testing):
-- ALTER TABLE user_profiles DISABLE TRIGGER on_user_profile_created;

-- Re-enable trigger:
-- ALTER TABLE user_profiles ENABLE TRIGGER on_user_profile_created;
