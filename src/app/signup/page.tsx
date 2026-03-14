'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Handshake, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmation, setIsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up the user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // Create user profile in our database
        try {
          await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.user.id,
              email,
              fullName,
            }),
          })
        } catch {
          // Profile creation can fail if middleware blocks — will be retried on first login
        }

        if (data.session) {
          // Email confirmation disabled — user is logged in immediately
          router.push('/dashboard')
          router.refresh()
        } else {
          // Email confirmation enabled — show success message
          setError('')
          setIsConfirmation(true)
        }
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start managing loans with friends & family</CardDescription>
        </CardHeader>
        <CardContent>
          {isConfirmation ? (
            <div className="text-center py-4 space-y-4">
              <MailCheck className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Check your email</h3>
              <p className="text-sm text-slate-400">
                We sent a confirmation link to <strong className="text-white">{email}</strong>.
                Click the link to activate your account.
              </p>
              <p className="text-xs text-slate-500">
                Didn&apos;t receive it? Check your spam folder.
              </p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">Minimum 8 characters</p>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign in
            </Link>
          </p>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
