import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import { verify2FAToken, encryptAndStore2FASecret } from '@/lib/2fa';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const { token, secret } = await request.json();

        if (!token || !secret) {
            return NextResponse.json({
                success: false,
                error: 'Token and secret are required'
            }, { status: 400 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        const encryptedSecret = encryptAndStore2FASecret(secret);
        const isValid = verify2FAToken(token, encryptedSecret);

        if (!isValid) {
            return NextResponse.json({
                success: false,
                error: 'Invalid 2FA code'
            }, { status: 400 });
        }

        user.twoFactorEnabled = true;
        user.twoFactorSecret = encryptedSecret;
        await user.save();

        return NextResponse.json({
            success: true,
            message: '2FA enabled successfully'
        });

    } catch (error) {
        console.error('2FA verify error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to verify 2FA'
        }, { status: 500 });
    }
}
