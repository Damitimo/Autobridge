/**
 * Multi-channel notification service
 * Supports: Email, SMS, WhatsApp, Push Notifications
 */

import { db } from '@/db';
import { notifications } from '@/db/schema';

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
  // Integration with SendGrid or AWS SES
  console.log('Sending email:', payload);
  
  // In production:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: userEmail,
  //   from: process.env.SENDGRID_FROM_EMAIL,
  //   subject: payload.title,
  //   html: payload.message,
  // });
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

// Predefined notification templates
export const NotificationTemplates = {
  bidWon: (vehicleName: string, amount: number) => ({
    title: '🎉 Congratulations! You won the auction',
    message: `You have successfully won the auction for ${vehicleName} at $${amount.toLocaleString()}. Please proceed to payment.`,
    type: 'bid_won',
  }),
  
  bidLost: (vehicleName: string) => ({
    title: 'Auction Lost',
    message: `Unfortunately, you did not win the auction for ${vehicleName}. Browse more vehicles to find your next opportunity.`,
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
};
