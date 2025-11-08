# Complete Setup Guide - Deployment & Auth

## 📋 Overview

This guide will walk you through:
1. ✅ Preparing your database
2. ✅ Deploying to Vercel
3. ✅ Configuring Supabase
4. ✅ Setting up email notifications
5. ✅ Testing everything

**Time estimate**: 20-30 minutes

---

## Part 1: Prepare Supabase Database (5 minutes)

### Step 1.1: Add email_verified Column

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste and run this SQL:

```sql
-- Add email_verified column to track email confirmation
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Sync existing profiles with auth.users
UPDATE user_profiles 
SET email_verified = COALESCE(
  (
    SELECT (raw_user_meta_data->>'email_verified')::boolean
    FROM auth.users 
    WHERE auth.users.id = user_profiles.id
  ), 
  false
);

-- Create trigger to sync email_verified when user confirms email
CREATE OR REPLACE FUNCTION sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET email_verified = true,
      updated_at = NOW()
  WHERE id = NEW.id
    AND email_verified = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (
  OLD.email_confirmed_at IS NULL 
  AND NEW.email_confirmed_at IS NOT NULL
)
EXECUTE FUNCTION sync_email_verified();

-- Verify demo account
SELECT id, email, approved, email_verified 
FROM user_profiles 
WHERE email = 'demo@datadash.com';

-- If demo account shows email_verified = false, fix it:
UPDATE user_profiles 
SET email_verified = true 
WHERE email = 'demo@datadash.com';
```

✅ **Done!** The column is added and will automatically sync when users confirm emails.

---

## Part 2: Deploy to Vercel (10 minutes)

### Step 2.1: Commit and Push Code

```bash
git add .
git commit -m "Add Supabase authentication with approval workflow"
git push origin master
```

### Step 2.2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Select your GitHub repository
4. Framework: **Next.js** (auto-detected)
5. **Don't deploy yet** - we need to add environment variables first

### Step 2.3: Add Environment Variables

In Vercel, go to **Settings** → **Environment Variables** and add these:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
APPROVAL_SECRET=your_approval_secret_here
NEXT_PUBLIC_SITE_URL=https://YOUR_APP_URL_HERE.vercel.app
ADMIN_EMAIL=drs1572@proton.me
```

**Get these values from:**
- Supabase keys: Supabase Dashboard → Project Settings → API
- Anthropic key: Anthropic Console → API Keys
- Approval secret: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Note**: You'll update `NEXT_PUBLIC_SITE_URL` after the first deployment.

Select **Production**, **Preview**, and **Development** for each variable.

### Step 2.4: Deploy

1. Click **Deploy**
2. Wait for deployment to complete (~2-3 minutes)
3. Copy your deployment URL (e.g., `https://alt-data-dashboard-abc123.vercel.app`)

### Step 2.5: Update NEXT_PUBLIC_SITE_URL

1. Go back to **Settings** → **Environment Variables**
2. Edit `NEXT_PUBLIC_SITE_URL`
3. Replace with your actual Vercel URL
4. Click **Save**
5. Go to **Deployments** → Click **...** on latest deployment → **Redeploy**

✅ **Done!** Your app is deployed.

---

## Part 3: Configure Supabase Auth (5 minutes)

### Step 3.1: Update Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update these settings:

   **Site URL**: 
   ```
   https://your-app.vercel.app
   ```

   **Redirect URLs** (click Add URL for each):
   ```
   https://your-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

5. Click **Save**

✅ **Done!** Auth redirects configured.

---

## Part 4: Set Up Email Notifications (10 minutes)

This sends you approval emails when users confirm their email addresses.

### Step 4.1: Enable pg_net Extension

1. In Supabase Dashboard, go to **Database** → **Extensions**
2. Search for `pg_net`
3. Click **Enable**

### Step 4.2: Create Notification Trigger

1. Go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL (⚠️ **IMPORTANT**: Replace `YOUR_APP_URL` with your Vercel URL):

```sql
-- Enable HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to notify admin when user confirms email
CREATE OR REPLACE FUNCTION notify_admin_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Make HTTP POST to your Next.js API
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL.vercel.app/api/notify-admin',  -- ⚠️ UPDATE THIS LINE
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'user', json_build_object(
        'id', NEW.id,
        'email', NEW.email
      )
    )::jsonb,
    timeout_milliseconds := 5000
  ) INTO request_id;
  
  RAISE NOTICE 'Notification sent for user % (request_id: %)', NEW.email, request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
DROP TRIGGER IF EXISTS on_user_email_confirmed ON user_profiles;

-- Create trigger that fires when email is confirmed
CREATE TRIGGER on_user_email_confirmed
AFTER UPDATE ON user_profiles
FOR EACH ROW
WHEN (
  OLD.email_verified = false 
  AND NEW.email_verified = true 
  AND NEW.approved = false
)
EXECUTE FUNCTION notify_admin_on_signup();
```

4. Click **Run**

✅ **Done!** Notifications will be sent when users confirm their emails.

### Step 4.3: Create Email Sending Edge Function

1. In Supabase Dashboard, go to **Edge Functions**
2. Click **Create Function**
3. Name: `send-approval-email`
4. Paste this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { to, userEmail, userId, approvalLink, signupDate } = await req.json()

    // For now, just log the approval info
    // You can implement actual email sending later with Resend/SendGrid
    console.log('='.repeat(50))
    console.log('NEW SIGNUP NEEDS APPROVAL')
    console.log('='.repeat(50))
    console.log('User Email:', userEmail)
    console.log('User ID:', userId)
    console.log('Signed Up:', signupDate)
    console.log('Approval Link:', approvalLink)
    console.log('Send To:', to)
    console.log('='.repeat(50))

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

5. Click **Deploy**
6. In deployment settings, disable **Verify JWT** (this is an internal call)

**Note**: For now, approval links will appear in the Edge Function logs. You can click them manually to approve users. To send actual emails, you'd integrate Resend or SendGrid later.

✅ **Done!** Email notification system is ready.

---

## Part 5: Testing (10 minutes)

### Test 1: Route Protection ✅

1. Open incognito/private window
2. Go to your Vercel URL
3. **Expected**: Redirected to `/login`

### Test 2: Demo Account ✅

1. On login page, enter:
   - Email: `demo@datadash.com`
   - Password: `Deno123!`
2. Click **Sign In**
3. **Expected**:
   - No yellow approval banner
   - Search input and buttons enabled
   - Can use all features

### Test 3: New User Signup Flow ✅

1. Click **Sign up** link
2. Enter a test email (use a real email you can access)
3. Enter password (min 6 chars) and confirm
4. Click **Sign Up**
5. **Expected**: "Check your email" success screen

### Test 4: Email Confirmation ✅

1. Check your email inbox
2. Open Supabase confirmation email
3. Click **Confirm Email** button
4. **Expected**: Redirected to your app's login page

### Test 5: Pending Approval State ✅

1. Login with your test account credentials
2. **Expected**:
   - Yellow approval banner at top
   - Search input disabled (greyed out)
   - "Pending" badge next to email in navbar
   - Can see the dashboard but can't use search

### Test 6: Check Admin Notification ✅

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **send-approval-email**
3. Click **Logs** tab
4. **Expected**: See log entry with approval link
5. Copy the approval link from the logs

**OR**

Check your server logs in Vercel:
1. Go to Vercel Dashboard → Your Project
2. Click **Functions** → `/api/notify-admin`
3. View logs for the approval link

### Test 7: Approve User ✅

1. Paste the approval link in your browser
2. **Expected**: See green "✅ User Approved" success page

### Test 8: Verify Full Access ✅

1. Go back to the tab where your test user is logged in
2. Refresh the page (or wait a few seconds for real-time update)
3. **Expected**:
   - Yellow banner disappears
   - Search input enabled
   - "Pending" badge removed
   - Can now use all features

### Test 9: Real-time Updates (Bonus) ✅

1. Login as unapproved user in one browser
2. In another tab, click approval link
3. **Expected**: First browser updates automatically without refresh!

---

## 🎉 Success Checklist

- [ ] App deployed to Vercel
- [ ] Environment variables configured
- [ ] Supabase redirect URLs updated
- [ ] Database triggers created
- [ ] Edge Function deployed
- [ ] Demo account works (no approval needed)
- [ ] New signups require email confirmation
- [ ] Approval notifications sent to logs
- [ ] Approval links work
- [ ] Approved users get full access
- [ ] Real-time updates working

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Check all env vars are set in Vercel
- Redeploy after adding them

### Email confirmation link goes to localhost
- Update Supabase redirect URLs to your Vercel domain
- Make sure Site URL is set correctly

### No approval notification after email confirmation
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_user_email_confirmed';

-- Check if email_verified changed
SELECT email, email_verified FROM user_profiles WHERE email = 'test@example.com';

-- View webhook logs
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;
```

### Demo account shows approval banner
```sql
-- Fix demo account
UPDATE user_profiles 
SET approved = true, email_verified = true 
WHERE email = 'demo@datadash.com';
```

### Approval link doesn't work
- Verify `APPROVAL_SECRET` matches in Vercel
- Check `NEXT_PUBLIC_SITE_URL` is correct

---

## 🚀 Next Steps (Optional)

### Add Real Email Sending

Currently, approval links appear in logs. To send actual emails:

1. **Option A: Resend** (Easiest)
   - Sign up at [resend.com](https://resend.com)
   - Get API key
   - Update Edge Function with Resend code

2. **Option B: SendGrid**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Get API key
   - Update Edge Function with SendGrid code

3. **Option C: Gmail SMTP**
   - Create app password in Google Account
   - Configure SMTP in Edge Function

For now, manually checking logs and clicking links works perfectly fine!

---

## 📁 Summary

You now have:
- ✅ Secure authentication with email confirmation
- ✅ Two-step approval workflow (email confirm → admin approve)
- ✅ Real-time UI updates when approved
- ✅ Database-level security with RLS
- ✅ Demo account for testing/demos
- ✅ Deployed to production on Vercel

**Total setup time**: ~30 minutes

**Questions?** Check the other markdown files for deep dives on specific topics, or refer back to this guide for the complete flow.

---

**You're all set! 🎊**
