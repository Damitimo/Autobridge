/**
 * Multi-channel notification service
 * Supports: Email, SMS, WhatsApp, Push Notifications
 */

import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push';

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const channels = payload.channels || ['in_app'];
  
  // Save to database (in-app notification)
  if (channels.includes('in_app')) {
    await db.insert(notifications).values({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId,
      channels,
    });
  }
  
  // Send email
  if (channels.includes('email')) {
    await sendEmail(payload);
  }
  
  // Send SMS
  if (channels.includes('sms')) {
    await sendSMS(payload);
  }
  
  // Send WhatsApp
  if (channels.includes('whatsapp')) {
    await sendWhatsApp(payload);
  }
  
  // Send push notification
  if (channels.includes('push')) {
    await sendPushNotification(payload);
  }
}

async function sendEmail(payload: NotificationPayload): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Get user email from database
    const user = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user.length || !user[0].email) {
      console.error('No email found for user:', payload.userId);
      return;
    }

    const { error } = await resend.emails.send({
      from: `AutoBridge <${process.env.RESEND_FROM_EMAIL}>`,
      to: user[0].email,
      subject: payload.title,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">AutoBridge</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">${payload.title}</h2>
            <p style="color: #555; line-height: 1.6;">${payload.message}</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AutoBridge. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
    }
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

async function sendSMS(payload: NotificationPayload): Promise<void> {
  // Integration with Termii or Africa's Talking
  console.log('Sending SMS:', payload);
  
  // In production:
  // const response = await fetch('https://api.ng.termii.com/api/sms/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     api_key: process.env.TERMII_API_KEY,
  //     to: userPhone,
  //     from: process.env.TERMII_SENDER_ID,
  //     sms: payload.message,
  //     type: 'plain',
  //     channel: 'generic',
  //   }),
  // });
}

async function sendWhatsApp(payload: NotificationPayload): Promise<void> {
  // Integration with Twilio WhatsApp API
  console.log('Sending WhatsApp:', payload);
  
  // In production:
  // const client = require('twilio')(
  //   process.env.TWILIO_ACCOUNT_SID,
  //   process.env.TWILIO_AUTH_TOKEN
  // );
  // await client.messages.create({
  //   from: process.env.TWILIO_WHATSAPP_NUMBER,
  //   to: `whatsapp:${userPhone}`,
  //   body: payload.message,
  // });
}

async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  // Integration with Firebase Cloud Messaging or OneSignal
  console.log('Sending push notification:', payload);
}

/**
 * Send an email directly to the admin
 */
export async function sendAdminEmail(subject: string, message: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error('ADMIN_EMAIL not configured');
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: `AutoBridge <${process.env.RESEND_FROM_EMAIL}>`,
      to: adminEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">AutoBridge Admin</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            <div style="color: #555; line-height: 1.6;">${message}</div>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AutoBridge Admin Notification</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send admin email:', error);
    }
  } catch (error) {
    console.error('Admin email sending error:', error);
  }
}

/**
 * Send email to a specific email address (for waitlist confirmations, etc.)
 */
export async function sendEmailToAddress(
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: `AutoBridge <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">AutoBridge</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            <div style="color: #555; line-height: 1.6;">${message}</div>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AutoBridge. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: String(error) };
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  // Email verification code
  emailVerification: (code: string, firstName: string) => ({
    title: 'Verify Your Email - AutoBridge',
    message: `Hi ${firstName},<br><br>Welcome to AutoBridge! Please use the code below to verify your email address:<br><br><div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;"><span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${code}</span></div><br>This code expires in 15 minutes.<br><br>If you didn't create an account with AutoBridge, please ignore this email.<br><br>Best regards,<br>The AutoBridge Team`,
    type: 'email_verification',
  }),

  // Welcome email for new users (sent after verification)
  welcome: (firstName: string) => ({
    title: 'Welcome to AutoBridge!',
    message: `Hi ${firstName},<br><br>Your email has been verified! Welcome to AutoBridge.<br><br>You're now ready to explore thousands of vehicles from U.S. auctions. Browse our inventory, calculate landed costs, and when you're ready to bid, we'll guide you through the process.<br><br>If you have any questions, just reply to this email.<br><br>Best regards,<br>The AutoBridge Team`,
    type: 'welcome',
  }),

  // Bid placed by admin on user's behalf
  bidPlaced: (vehicleName: string, amount: number) => ({
    title: 'Your Bid Has Been Placed',
    message: `Great news! Your bid of $${amount.toLocaleString()} for ${vehicleName} has been successfully placed on the auction. We'll notify you of any updates.`,
    type: 'bid_placed',
  }),

  bidWon: (vehicleName: string, amount: number) => ({
    title: 'Congratulations! You won the auction',
    message: `You have successfully won the auction for ${vehicleName} at $${amount.toLocaleString()}. Please proceed to payment to begin the shipping process.`,
    type: 'bid_won',
  }),

  bidLost: (vehicleName: string) => ({
    title: 'Auction Update',
    message: `Unfortunately, you did not win the auction for ${vehicleName}. Don't worry - browse more vehicles to find your next opportunity!`,
    type: 'bid_lost',
  }),
  
  paymentReceived: (amount: number) => ({
    title: 'Payment Received',
    message: `We have received your payment of ₦${amount.toLocaleString()}. Your vehicle will be picked up shortly.`,
    type: 'payment_received',
  }),
  
  shipmentUpdate: (status: string, vehicleName: string) => ({
    title: 'Shipment Update',
    message: `Your ${vehicleName} is now: ${status}`,
    type: 'shipment_update',
  }),
  
  vesselDeparted: (vehicleName: string, eta: string) => ({
    title: '🚢 Vessel Departed',
    message: `Your ${vehicleName} has departed the U.S. port. Estimated arrival in Nigeria: ${eta}`,
    type: 'vessel_departed',
  }),
  
  customsCleared: (vehicleName: string) => ({
    title: '✅ Customs Cleared',
    message: `Great news! Your ${vehicleName} has cleared Nigerian customs. Delivery will be scheduled soon.`,
    type: 'customs_cleared',
  }),
  
  delivered: (vehicleName: string) => ({
    title: '🎊 Vehicle Delivered!',
    message: `Your ${vehicleName} has been successfully delivered. Thank you for using AutoBridge!`,
    type: 'delivered',
  }),
  
  paymentReminder: (amount: number, dueDate: string) => ({
    title: 'Payment Reminder',
    message: `You have a pending payment of ₦${amount.toLocaleString()} due by ${dueDate}. Please complete payment to avoid delays.`,
    type: 'payment_reminder',
  }),

  // Password reset
  passwordReset: (resetLink: string) => ({
    title: 'Reset Your Password',
    message: `You requested to reset your password. Click the link below to set a new password:<br><br><a href="${resetLink}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a><br><br>This link expires in 1 hour.<br><br>If you didn't request this, please ignore this email.`,
    type: 'password_reset',
  }),

  // Password changed confirmation
  passwordChanged: () => ({
    title: 'Password Changed Successfully',
    message: `Your password has been changed successfully. If you didn't make this change, please contact us immediately at hello@autobridge.ng.`,
    type: 'password_changed',
  }),

  // New message notification (admin to user)
  newMessageFromAdmin: (subject: string, messagePreview: string) => ({
    title: `New Message: ${subject}`,
    message: `You have a new message from AutoBridge Support:<br><br><div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0; font-style: italic;">"${messagePreview.length > 200 ? messagePreview.slice(0, 200) + '...' : messagePreview}"</div><br><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Message</a>`,
    type: 'new_message',
  }),

  // New message notification (user to admin)
  newMessageFromUser: (userName: string, subject: string, messagePreview: string) => ({
    title: `New Message from ${userName}`,
    message: `${userName} sent a new message:<br><br><strong>Subject:</strong> ${subject}<br><br><div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0; font-style: italic;">"${messagePreview.length > 200 ? messagePreview.slice(0, 200) + '...' : messagePreview}"</div><br><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/messages" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Admin Portal</a>`,
    type: 'new_message_admin',
  }),
};
