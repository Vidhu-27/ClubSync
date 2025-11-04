'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  LogOut,
  Menu,
  X,
  User,
  Building2,
  FileText
} from 'lucide-react'

interface SidebarProps {
  user: {
    role: string
    email: string
    clubName?: string
  }
  onLogout: () => void
}

const navigationItems = {
  director: [
    { name: 'Overview', href: '/dashboard/director', icon: LayoutDashboard },
    { name: 'Club Management', href: '/dashboard/director/clubs', icon: Building2 },
    { name: 'Event Approvals', href: '/dashboard/director/events', icon: Calendar },
    { name: 'Budget Requests', href: '/dashboard/director/budget', icon: DollarSign },
    { name: 'Reports', href: '/dashboard/director/reports', icon: FileText },
  ],
  club: [
    { name: 'Home', href: '/dashboard/club', icon: LayoutDashboard },
    { name: 'Members', href: '/dashboard/club/members', icon: Users },
    { name: 'Events', href: '/dashboard/club/events', icon: Calendar },
    { name: 'Reports', href: '/dashboard/club/reports', icon: FileText },
  ],
  faculty: [
    { name: 'Dashboard', href: '/dashboard/faculty', icon: LayoutDashboard },
    { name: 'Club Overview', href: '/dashboard/faculty/club', icon: Building2 },
  ]
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  const items = navigationItems[user.role as keyof typeof navigationItems] || []

  // Determine a single active item by longest href prefix match
  const activeHref = (() => {
    if (!pathname) return ''
    const candidates = items
      .map((i) => i.href)
      .filter((href) => pathname === href || pathname.startsWith(href + '/'))
      .sort((a, b) => b.length - a.length)
    return candidates[0] || ''
  })()

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-neutral-900 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">ClubSync</h1>
                <p className="text-xs text-muted">Department utility</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted capitalize">
                  {user.role}
                  {user.clubName && ` • ${user.clubName}`}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              // Compare pathname against the base href (strip any hash/fragments)
              const baseHref = item.href.split('#')[0]
              const isActive = baseHref === activeHref
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    sidebar-link group
                    ${isActive ? 'active' : ''}
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-neutral-900">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-150"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

