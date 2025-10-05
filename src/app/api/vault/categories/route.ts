import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import VaultItem from '@/models/VaultItem';
import User from '@/models/User';

export async function GET() {
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

        const categories = await VaultItem.distinct('category', { userId: user._id });

        return NextResponse.json({
            success: true,
            categories: categories.sort()
        });

    } catch (error) {
        console.error('Categories fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
