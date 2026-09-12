import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// In-memory rate limiting map for brute-force protection
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000;  // 15 Minutes

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter both username and password.');
        }

        const key = credentials.username.toLowerCase().trim();
        const now = Date.now();
        const attempt = loginAttempts.get(key);

        // 1. Check if user is currently locked out
        if (attempt?.lockedUntil && attempt.lockedUntil > now) {
          const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
          throw new Error(`SECURITY_LOCKOUT: Account locked due to repeated failed attempts. Please retry in ${remainingMinutes} minute(s).`);
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user) {
          // Constant-time: prevent user enumeration via timing
          await bcrypt.compare(credentials.password, '$2b$10$dummyhashtopreventtimingattacks000000000000000');
          
          const currentCount = (attempt && (now - attempt.lastAttempt < WINDOW_DURATION_MS)) ? attempt.count + 1 : 1;
          const isLocked = currentCount >= MAX_FAILED_ATTEMPTS;

          loginAttempts.set(key, {
            count: currentCount,
            lastAttempt: now,
            lockedUntil: isLocked ? now + LOCKOUT_DURATION_MS : undefined
          });

          if (isLocked) {
            throw new Error('SECURITY_LOCKOUT: 5 failed attempts detected. Terminal locked for 15 minutes.');
          }

          throw new Error(`INVALID_CREDENTIALS: Invalid username or password (${MAX_FAILED_ATTEMPTS - currentCount} attempt(s) remaining).`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const currentCount = (attempt && (now - attempt.lastAttempt < WINDOW_DURATION_MS)) ? attempt.count + 1 : 1;
          const isLocked = currentCount >= MAX_FAILED_ATTEMPTS;

          loginAttempts.set(key, {
            count: currentCount,
            lastAttempt: now,
            lockedUntil: isLocked ? now + LOCKOUT_DURATION_MS : undefined
          });

          if (isLocked) {
            throw new Error('SECURITY_LOCKOUT: 5 failed attempts detected. Terminal locked for 15 minutes.');
          }

          throw new Error(`INVALID_CREDENTIALS: Invalid username or password (${MAX_FAILED_ATTEMPTS - currentCount} attempt(s) remaining).`);
        }

        // On successful authentication, reset failed attempts
        loginAttempts.delete(key);

        return {
          id: user.id,
          name: user.username,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.name || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes max inactive session timeout
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Omitting maxAge forces browser to treat this as a Session-Only cookie (destroyed when browser closes)
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
