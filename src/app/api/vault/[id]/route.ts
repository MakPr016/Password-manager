import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import VaultItem from '@/models/VaultItem';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        const vaultItem = await VaultItem.findOne({
            _id: id,
            userId: user._id
        }).lean() as {
            _id: mongoose.Types.ObjectId;
            encryptedData: string;
            category: string;
            isFavorite: boolean;
            createdAt: Date;
        } | null;

        if (!vaultItem) {
            return NextResponse.json({
                success: false,
                error: 'Vault item not found'
            }, { status: 404 });
        }

        const item = {
            _id: vaultItem._id.toString(),
            encryptedData: vaultItem.encryptedData,
            category: vaultItem.category,
            isFavorite: vaultItem.isFavorite,
            createdAt: vaultItem.createdAt.toISOString()
        };

        return NextResponse.json({
            success: true,
            item
        });

    } catch (error) {
        console.error('Vault item fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id } = await params;
        const { encryptedData, category, isFavorite } = await request.json();

        const item = await VaultItem.findOneAndUpdate(
            { _id: id, userId: user._id },
            { encryptedData, category, isFavorite },
            { new: true }
        );

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, item });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id } = await params;

        const item = await VaultItem.findOneAndDelete({
            _id: id,
            userId: user._id
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
