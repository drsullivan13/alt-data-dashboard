import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

function verifyApprovalToken(userId: string, token: string): boolean {
  const secret = process.env.APPROVAL_SECRET!
  const expectedToken = crypto.createHmac('sha256', secret)
    .update(userId)
    .digest('hex')
  return expectedToken === token
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const token = searchParams.get('token')

  if (!userId || !token) {
    return new NextResponse('Missing parameters', { status: 400 })
  }

  if (!verifyApprovalToken(userId, token)) {
    return new NextResponse('Invalid token', { status: 403 })
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      approved: true, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to approve user:', error)
    return new NextResponse('Failed to approve user', { status: 500 })
  }

  console.log(`✅ User ${userId} approved and can now access all features`)

  return new NextResponse(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>User Approved</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            text-align: center;
            padding: 20px;
            background: #f9fafb;
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #10b981;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ User Approved</h1>
          <p>The user has been approved and can now access all features of the Alternative Data Dashboard.</p>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}
