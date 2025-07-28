import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Email Configuration Test ===')
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM ? 'present' : 'missing')
    console.log('PASS:', process.env.PASS ? 'present' : 'missing')
    console.log('EMAIL_FROM value:', process.env.EMAIL_FROM)
    console.log('PASS length:', process.env.PASS?.length)

    if (!process.env.EMAIL_FROM || !process.env.PASS) {
      return NextResponse.json({
        error: 'Email configuration missing',
        emailFrom: process.env.EMAIL_FROM ? 'present' : 'missing',
        pass: process.env.PASS ? 'present' : 'missing'
      }, { status: 500 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Test connection
    try {
      await transporter.verify()
      console.log('✅ SMTP connection verified successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Email configuration is working!',
        emailFrom: process.env.EMAIL_FROM,
        passLength: process.env.PASS?.length
      })
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError)
      return NextResponse.json({
        error: 'SMTP verification failed',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Test email API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 