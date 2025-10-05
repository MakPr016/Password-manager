import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

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

        const { name } = await request.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Name is required'
            }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { name: name.trim() },
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
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
