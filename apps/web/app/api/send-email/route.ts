import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, name } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    if (!process.env.EMAIL_FROM || !process.env.SMTP_PASSWORD) {
      console.error('Missing email configuration:')
      console.error('EMAIL_FROM:', process.env.EMAIL_FROM ? 'present' : 'missing')
      console.error('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'present' : 'missing')
      return NextResponse.json(
        { error: 'Email configuration missing' },
        { status: 500 }
      )
    }

    console.log('Email configuration loaded successfully')
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
    console.log('SMTP_PASSWORD length:', process.env.SMTP_PASSWORD?.length)

    // Create transporter using Gmail SMTP with more robust configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Verify transporter configuration
    try {
      await transporter.verify()
      console.log('SMTP transporter verified successfully')
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError)
      return NextResponse.json(
        { error: 'Email server configuration error', details: verifyError instanceof Error ? verifyError.message : 'SMTP verification failed' },
        { status: 500 }
      )
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"Mercor Time Tracker" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      html: html
    })

    console.log('Email sent successfully:', info.messageId)
    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    })

  } catch (error) {
    console.error('Email API error:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}