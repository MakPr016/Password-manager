import NextAuth from 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        name: string;
        twoFactorEnabled: boolean;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            twoFactorEnabled: boolean;
        };
    }
}


declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        twoFactorEnabled: boolean;
    }
}