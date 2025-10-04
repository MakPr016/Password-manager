import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    return NextResponse.json({
      success: true,
      message: 'NextAuth setup is working!',
      mongodb: 'Connected',
      environment: {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasMongoUri: !!process.env.MONGODB_URI,
        has2faKey: !!process.env.TWOFA_ENCRYPTION_KEY
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
