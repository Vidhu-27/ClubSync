'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Users, Building2, User, Link as LinkIcon } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    club_name: '',
    head: '',
    description: '',
    contact_links: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!formData.email.endsWith('@mitwpu.edu.in')) {
      setError('Use your college email (@mitwpu.edu.in)')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/?message=Registration submitted. Wait for director approval.')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white text-black rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-semibold">ClubSync</h1>
          </div>
          <p className="text-muted">Register your club for director approval.</p>
        </div>

        {/* Registration Form */}
        <div className="card p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-center">Club registration</h2>
          
          {error && (
            <div className="flash-message mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Email address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field pl-12"
                  placeholder="your.email@mitwpu.edu.in"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field pl-12 pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-field pl-12 pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Club Name */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Club name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  name="club_name"
                  value={formData.club_name}
                  onChange={handleInputChange}
                  className="input-field pl-12"
                  placeholder="Enter club name"
                  required
                />
              </div>
            </div>

            {/* Club Head */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Club head *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  name="head"
                  value={formData.head}
                  onChange={handleInputChange}
                  className="input-field pl-12"
                  placeholder="Enter club head name"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Club Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe your club's purpose and activities"
                required
              />
            </div>

            {/* Contact Links */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Contact links (optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  name="contact_links"
                  value={formData.contact_links}
                  onChange={handleInputChange}
                  className="input-field pl-12"
                  placeholder="Social media links, website, etc."
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Enter links separated by commas (e.g., https://instagram.com/club, https://website.com)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Register Club
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-muted mb-2">Already have an account?</p>
            <Link href="/" className="underline text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

