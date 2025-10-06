import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import { verify2FAToken } from '@/lib/2fa';

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                twoFactorCode: { label: '2FA Code', type: 'text' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and Password required");
                }

                try {
                    await connectMongo();
                    const user = await User.findOne({ email: credentials?.email });

                    if (!user) {
                        throw new Error('No user found with email');
                    }

                    const isValidPassword = await bcrypt.compare(
                        credentials.password,
                        user.hashedPassword
                    );
                    if (!isValidPassword) {
                        throw new Error('Invalid password');
                    }
                    if (user.twoFactorEnabled && user.twoFactorSecret) {
                        if (!credentials.twoFactorCode) {
                            throw new Error('2FA is REQUIRED');
                        }
                        const is2FAValid = verify2FAToken(
                            credentials.twoFactorCode,
                            user.twoFactorSecret
                        );
                        if (!is2FAValid) {
                            throw new Error('Invalid 2FA code');
                        }
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        twoFactorEnabled: user.twoFactorEnabled
                    };
                }
                catch (error) {
                    console.error("Auth  error", error);
                    throw error;
                }
            }
        })
    ],
    pages: {
        signIn: 'auth/signin'
    },
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24 * 7
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.twoFactorEnabled = user.twoFactorEnabled
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.twoFactorEnabled = token.twoFactorEnabled;
            }

            return session;
        },

        async redirect({ url, baseUrl }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        }
    },
    events: {
        async signIn(message) {
            console.log('User signed in');
        },
        async signOut(message) {
            console.log('User signed out');
        }
    },

    debug: process.env.NODE_ENV === 'development'
});

export { handler as GET, handler as POST };