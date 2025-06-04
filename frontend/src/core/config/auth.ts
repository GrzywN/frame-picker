/**
 * Authentication configuration
 */
export const authConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 60, // 30 minutes
  },
  providers: {
    credentials: {
      name: 'credentials',
      type: 'credentials',
    },
  },
}
