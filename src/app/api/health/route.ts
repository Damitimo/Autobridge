import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasPaystack: !!process.env.PAYSTACK_SECRET_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    }
  });
}
