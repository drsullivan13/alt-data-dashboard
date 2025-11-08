# Trace The Exact Flow

## The Email Link You're Getting

```
https://iunyzciscfmxbgcnavwi.supabase.co/auth/v1/verify?token=pkce_...&type=signup&redirect_to=https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app/auth/callback
```

## What Should Happen

1. User clicks link
2. Goes to Supabase verification endpoint
3. Supabase verifies the token
4. Supabase redirects to: `https://your-app.vercel.app/auth/callback?code=XXXXX`
5. Your callback route handles the `code` parameter
6. Exchanges code for session
7. Redirects to home

## But You're Getting

```
/login?error=Error confirming user#error=server_error&error_code=unexpected_failure&error_description=Error+confirming+user
```

This means Supabase's verification endpoint is failing BEFORE it redirects to your callback.

## The Root Cause

The error is happening at **step 3** - Supabase can't verify the token.

## Possible Reasons

### 1. Email Confirmation is DISABLED in Supabase
**Check**: Supabase Dashboard → Authentication → Settings → Auth Providers → Email

Make sure:
- ✅ "Enable email provider" is checked
- ✅ "Confirm email" is checked

### 2. The Token Has Expired
Supabase email tokens expire. If you're testing with an old email, it won't work.

**Solution**: Sign up with a FRESH email every time you test.

### 3. Double Confirmation Issue
If the user was already confirmed, clicking the link again will fail.

**Check**: In Supabase Dashboard → Authentication → Users
- Look at your test user
- Is `email_confirmed_at` already set?
- If YES, that's the problem - you can't confirm twice

### 4. The Token Format is Wrong
The email template might be generating an invalid token.

## Let's Fix It - Simplified Approach

### Step 1: Check Email Provider Settings

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click **Email**
3. Make sure these are checked:
   - ✅ Enable email provider
   - ✅ Confirm email
   - ✅ Secure email change (optional)
4. Click **Save**

### Step 2: Use the SIMPLEST Email Template

Go to **Authentication** → **Email Templates** → **Confirm signup**

Replace with this MINIMAL template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

That's it. Nothing else. Click **Save**.

### Step 3: Check URL Configuration ONE MORE TIME

**Authentication** → **URL Configuration**

**Site URL** (must be EXACT, no trailing slash):
```
https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app
```

**Redirect URLs** (all three):
```
https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app/auth/callback
https://alt-data-dashboard-drsullivan13-drsullivan13s-projects.vercel.app/**
http://localhost:3000/auth/callback
```

Click **Save**.

### Step 4: Delete ALL Test Users

1. Go to **Authentication** → **Users**
2. Delete EVERY test user you created
3. Start completely fresh

### Step 5: Test with Brand New Email

1. Use an email you've NEVER used before in this Supabase project
2. Sign up
3. Check email IMMEDIATELY (don't wait - tokens expire)
4. Click link within 5 minutes
5. Should work

## Alternative: Check Supabase Logs

Go to Supabase Dashboard → **Logs** → **Auth Logs**

Look for entries around the time you clicked the link. The logs will tell you EXACTLY why verification failed.

Look for:
- "Invalid token"
- "Token expired"
- "User already confirmed"
- "Redirect URL not allowed"

The log message will tell us the exact issue.

## Nuclear Option: Disable Email Confirmation Temporarily

If you want to test the rest of the flow:

1. Go to **Authentication** → **Providers** → **Email**
2. **UNCHECK** "Confirm email"
3. Save
4. Now signups will be automatically confirmed
5. You can test the approval workflow
6. Re-enable "Confirm email" later

This lets you move forward while we debug the confirmation issue.

---

**What do you see in the Supabase Auth Logs?** That will tell us exactly what's failing.
