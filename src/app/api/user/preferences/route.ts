import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(_request: NextRequest) {
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

        return NextResponse.json({
            success: true,
            preferences: user.preferences
        });

    } catch (error) {
        console.error('Get preferences error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        await connectMongo();

        const { autoClearTime } = await request.json();

        if (autoClearTime === undefined || autoClearTime < 5) {
            return NextResponse.json({
                success: false,
                error: 'Invalid auto clear time'
            }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { 
                'preferences.autoClearTime': autoClearTime 
            },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            preferences: user.preferences
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
