'use client'

import Sidebar from '@/components/Sidebar'
import { useDirectorDashboard } from '@/hooks/useDirectorDashboard'
import {
  Building2,
  Users,
  Calendar,
  Mail,
  CheckCircle
} from 'lucide-react'

export default function DirectorClubsPage() {
  const { user, data, isLoading, approveClub, rejectClub, logout } = useDirectorDashboard()
  const { pendingClubs, clubs } = data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const approvedClubs = clubs

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} onLogout={logout} />

      <div className="lg:ml-64">
        <div className="p-6 space-y-8">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold">Club management</h1>
            <p className="text-muted">Review pending requests and keep tabs on approved clubs.</p>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div>
                <h2 className="text-xl font-semibold">Pending approvals</h2>
                <p className="text-sm text-muted">Approve or reject clubs waiting for director review.</p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingClubs.length === 0 && (
                <div className="border border-neutral-800 rounded-lg p-6 text-center text-sm text-muted">
                  Every club is up to date. New submissions will appear here.
                </div>
              )}

              {pendingClubs.map((club) => (
                <article key={club.id} className="border border-neutral-800 rounded-lg p-5 space-y-4 bg-neutral-950/60">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{club.name}</h3>
                      <p className="text-sm text-muted">Head: {club.head}</p>
                      <p className="text-sm text-muted max-w-2xl leading-relaxed">{club.description}</p>
                      {club.email && (
                        <p className="flex items-center gap-2 text-sm text-muted">
                          <Mail className="h-4 w-4" />
                          <span>{club.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-primary text-sm"
                      onClick={() => approveClub({ id: club.id, email: club.email })}
                    >
                      Approve club
                    </button>
                    <button
                      className="btn-danger text-sm"
                      onClick={() => rejectClub({ id: club.id, email: club.email })}
                    >
                      Reject request
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold">Approved clubs</h2>
                <p className="text-sm text-muted">Snapshot of every approved organisation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {approvedClubs.length === 0 && (
                <div className="border border-neutral-800 rounded-lg p-6 text-center text-sm text-muted">
                  No clubs have been approved yet.
                </div>
              )}

              {approvedClubs.map((club) => (
                <article key={club.id} className="border border-neutral-800 rounded-lg p-5 space-y-4 bg-neutral-950/60">
                  <header className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-semibold"
                        style={{ backgroundColor: club.color || '#ffffff', color: '#000' }}
                      >
                        {club.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{club.name}</h3>
                        <p className="text-xs text-muted">Head: {club.head}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{club.description}</p>
                  </header>

                  <ul className="grid grid-cols-1 gap-2 text-sm">
                    <li className="flex items-center gap-2 text-muted">
                      <Users className="h-4 w-4" />
                      <span>{club.membersCount ?? 0} members</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <Calendar className="h-4 w-4" />
                      <span>{club.eventsCount ?? (club.events?.length ?? 0)} events</span>
                    </li>
                    {club.email && (
                      <li className="flex items-center gap-2 text-muted">
                        <Mail className="h-4 w-4" />
                        <span>{club.email}</span>
                      </li>
                    )}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
