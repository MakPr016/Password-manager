import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({
                success: false,
                twoFactorEnabled: false
            }, { status: 400 });
        }

        await connectMongo();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json({
                success: false,
                twoFactorEnabled: false
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            twoFactorEnabled: user.twoFactorEnabled || false
        });

    } catch (error) {
        console.error('Check 2FA error:', error);
        return NextResponse.json({
            success: false,
            twoFactorEnabled: false
        }, { status: 500 });
    }
}
