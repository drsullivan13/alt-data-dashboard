# Debug Auth Flow - Step by Step

## What's Happening

1. ✅ User signs up → Profile created
2. ✅ Email sent with confirmation link
3. ❌ User clicks link → Supabase verification fails: "Error confirming user"
4. ❌ Redirects to `/login?error=Error confirming user`

## The Problem

The error `#error=server_error&error_code=unexpected_failure&error_description=Error+confirming+user` suggests Supabase's verification endpoint is failing.

## Possible Causes

### 1. Email Template Issue
The email template might be using the wrong variables.

**Check**: Supabase Dashboard → Authentication → Email Templates → Confirm signup

**Should be**:
```html
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

**NOT**:
```html
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your mail</a></p>
```

### 2. Site URL Configuration
**Check**: Authentication → URL Configuration

**Site URL must be EXACT**:
```
https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app
```

No trailing slash, exact match to Vercel URL.

### 3. Redirect URL Not Whitelisted
**Check**: Authentication → URL Configuration → Redirect URLs

**Must include (exact)**:
```
https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app/auth/callback
https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app/**
```

### 4. Email Confirmation Settings
**Check**: Authentication → Settings

- ✅ Email confirmation should be ENABLED
- ✅ "Enable email confirmations" should be checked

## Solution Steps

### Step 1: Reset Email Template to Default

1. Go to Supabase → Authentication → Email Templates → Confirm signup
2. Click "Reset to default" (if available)
3. Or ensure it uses: `{{ .ConfirmationURL }}`

### Step 2: Verify URL Configuration

Run this checklist in Supabase Dashboard:

**Authentication → URL Configuration**:
- [ ] Site URL = `https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app`
- [ ] No trailing slash
- [ ] Redirect URLs include `/auth/callback`
- [ ] Redirect URLs include `/**` wildcard

### Step 3: Test with Fresh User

1. Delete ALL test users from Supabase
2. Sign up with NEW email (not one you've used before)
3. Check email
4. Click link

### Step 4: Check Supabase Logs

**If still failing**:
1. Go to Supabase Dashboard → Logs → Auth Logs
2. Look for errors during email confirmation
3. Check what URL Supabase is trying to redirect to

## Expected Flow (When Working)

```
1. Click email link
   ↓
2. Goes to: supabase.co/auth/v1/verify?token=...&redirect_to=YOUR_VERCEL_URL
   ↓
3. Supabase verifies token
   ↓
4. Redirects to: YOUR_VERCEL_URL/auth/callback?code=XXXXX
   ↓
5. Your callback exchanges code for session
   ↓
6. Redirects to: /
   ↓
7. User logged in ✅
```

## Quick Debug SQL

Run this in Supabase SQL Editor to check your test user:

```sql
-- Check user status
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data->>'email_verified' as meta_verified
FROM auth.users
WHERE email = 'YOUR_TEST_EMAIL'
ORDER BY created_at DESC
LIMIT 1;

-- Check if profile exists
SELECT id, email, email_verified, approved
FROM user_profiles
WHERE email = 'YOUR_TEST_EMAIL';
```

## Most Likely Fix

Based on the error, I bet the issue is:

**The redirect URL in your email template doesn't match what's whitelisted in Supabase.**

Try this:
1. Go to Supabase → Authentication → Email Templates
2. Change the confirm signup template to ONLY use:
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
   ```
3. Make sure it's NOT using any custom URL construction
4. Save
5. Delete test user and try again

Let me know what you see in the Supabase Auth Logs!
