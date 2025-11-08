import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

function generateApprovalToken(userId: string): string {
  const secret = process.env.APPROVAL_SECRET!
  return crypto.createHmac('sha256', secret)
    .update(userId)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json()
    
    const approvalLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/approve?userId=${user.id}&token=${generateApprovalToken(user.id)}`
    const adminEmail = process.env.ADMIN_EMAIL || 'drs1572@proton.me'
    
    // Log to console as backup
    console.log(`
======================================
NEW SIGNUP NEEDS APPROVAL
======================================
Email: ${user.email}
User ID: ${user.id}
Approval Link: ${approvalLink}
======================================
    `)
    
    // Send email via Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('send-approval-email', {
        body: {
          to: adminEmail,
          userEmail: user.email,
          userId: user.id,
          approvalLink: approvalLink,
          signupDate: new Date().toLocaleString()
        }
      })

      if (error) {
        console.error('Failed to send email via Supabase:', error)
      } else {
        console.log(`✅ Approval email sent to ${adminEmail}`)
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails - approval link is still logged
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notify-admin:', error)
    return NextResponse.json({ error: 'Failed to notify admin' }, { status: 500 })
  }
}
