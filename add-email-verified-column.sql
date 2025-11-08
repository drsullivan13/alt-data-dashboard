-- ============================================
-- Add email_verified column to user_profiles
-- ============================================
-- This column tracks whether the user has confirmed their email
-- Required for the approval notification trigger

-- Step 1: Add the column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Step 2: Sync existing profiles with auth.users email confirmation status
UPDATE user_profiles 
SET email_verified = COALESCE(
  (
    SELECT (raw_user_meta_data->>'email_verified')::boolean
    FROM auth.users 
    WHERE auth.users.id = user_profiles.id
  ), 
  false
);

-- Step 3: Create trigger to keep email_verified in sync with auth.users
-- This runs whenever a user confirms their email via Supabase auth
CREATE OR REPLACE FUNCTION sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles when auth confirmation happens
  UPDATE user_profiles
  SET email_verified = true,
      updated_at = NOW()
  WHERE id = NEW.id
    AND email_verified = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Create trigger on auth.users that fires when email is confirmed
CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (
  OLD.email_confirmed_at IS NULL 
  AND NEW.email_confirmed_at IS NOT NULL
)
EXECUTE FUNCTION sync_email_verified();

-- ============================================
-- Verification
-- ============================================
-- Check that column exists:
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'email_verified';

-- Check demo account status:
SELECT id, email, approved, email_verified 
FROM user_profiles 
WHERE email = 'demo@datadash.com';

-- If demo account shows email_verified = false, manually update:
-- UPDATE user_profiles 
-- SET email_verified = true 
-- WHERE email = 'demo@datadash.com';
