import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // If there's an error from Supabase, redirect to login
  if (error_description) {
    console.error('Auth callback error:', error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description)}`)
  }

  const supabase = await createClient()

  // Handle PKCE flow (email confirmation via Supabase server)
  // This is the standard flow when using {{ .ConfirmationURL }}
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Exchange code error:', error)
  }

  // Handle email confirmation with token_hash (alternative flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Verify OTP error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
