import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import { generate2FASecret, generateQRCode } from '@/lib/2fa';

export async function POST(request: NextRequest) {
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

        const userEmail = user.email;
        const { secret, otpauthUrl } = generate2FASecret(userEmail);
        
        if (!otpauthUrl) {
            return NextResponse.json({
                success: false,
                error: 'Failed to generate 2FA secret'
            }, { status: 500 });
        }

        const qrCode = await generateQRCode(otpauthUrl);

        return NextResponse.json({
            success: true,
            secret,
            qrCode,
            manualEntryKey: secret
        });

    } catch (error) {
        console.error('2FA setup error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to setup 2FA'
        }, { status: 500 });
    }
}
