import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(_request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();

        return NextResponse.json({
            success: true,
            message: '2FA disabled successfully'
        });

    } catch (error) {
        console.error('2FA disable error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to disable 2FA'
        }, { status: 500 });
    }
}
