/**
 * NextAuth.js configuration v4
 */
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authApi } from '@/core/api/auth'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
          })

          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.email,
            accessToken: response.access_token,
            tier: response.user.tier,
            is_active: response.user.is_active,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken
        token.tier = (user as any).tier
        token.is_active = (user as any).is_active
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session as any).accessToken = token.accessToken
        session.user.id = token.sub!
        ;(session.user as any).tier = token.tier
        ;(session.user as any).is_active = token.is_active
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this-in-production',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
