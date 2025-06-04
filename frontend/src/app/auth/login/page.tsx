/**
 * Login page
 */
import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
  return (
    <main className="container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <LoginForm />
    </main>
  )
}
