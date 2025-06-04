/**
 * Registration page
 */
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  return (
    <main className="container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <RegisterForm />
    </main>
  )
}
