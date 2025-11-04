'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'

function InfoMessage() {
  const searchParams = useSearchParams()
  const message = searchParams?.get('message') || ''

  if (!message) {
    return null
  }

  return <div className="flash-success">{message}</div>
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.toLowerCase().endsWith('@mitwpu.edu.in')) {
      setError('Please use your @mitwpu.edu.in email')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid credentials')
        return
      }

      if (!data.token) {
        setError('Unable to sign in. Please try again.')
        return
      }

      const role = data.user?.role || data.role

      // Store token per role so director and club can be logged in simultaneously in different tabs
      if (role === 'director') {
        localStorage.setItem('director_token', data.token)
      } else if (role === 'club') {
        localStorage.setItem('club_token', data.token)
      } else {
        localStorage.setItem('token', data.token)
      }

      if (role === 'director') {
        router.push('/dashboard/director')
      } else if (role === 'club') {
        router.push('/dashboard/club')
      } else if (role === 'faculty') {
        router.push('/dashboard/faculty')
      } else {
        setError('Unsupported role. Contact administrator.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold">Login into ClubSync</h1>
          <p className="text-muted">Sign in once and we&apos;ll route you to the right workspace.</p>
        </div>

        <div className="card p-8 space-y-6">
          <Suspense fallback={null}>
            <InfoMessage />
          </Suspense>

          {error && (
            <div className="flash-message">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-muted">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="name@mitwpu.edu.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-light w-full flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="border border-neutral-800 rounded-lg p-4 bg-black space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 text-primary-300" />
              <span>Directors and clubs share this login. We&apos;ll recognise your role automatically.</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Need a club account?</span>
              <a
                href="/register"
                className="underline"
              >
                Request director approval to create credentials
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

