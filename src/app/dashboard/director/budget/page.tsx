'use client'

import Sidebar from '@/components/Sidebar'
import { useDirectorDashboard } from '@/hooks/useDirectorDashboard'
import { formatInr } from '@/lib/currency'
import {
  DollarSign,
  CalendarDays,
  ClipboardList,
  Info
} from 'lucide-react'

export default function DirectorBudgetPage() {
  const { user, data, isLoading, logout } = useDirectorDashboard()
  const { stats, budgetRequestsAll, clubs, pendingClubs } = data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const source = budgetRequestsAll || []
  const pendingRequests = source.filter((request) => request.status === 'pending')
  // Treat both 'approved' and 'countered' as approved allocations
  const approvedRequests = source.filter((request) => request.status === 'approved' || request.status === 'countered')
  const rejectedRequests = source.filter((request) => request.status === 'rejected')

  const getClubMeta = (clubId: string | undefined) => {
    if (!clubId) return { name: '', color: '#999999' }
    const c = (clubs || []).find((cl) => cl.id === clubId) || (pendingClubs || []).find((cl) => cl.id === clubId)
    // If no match, suppress the name (remove "Unknown Club" details from UI)
    return { name: c?.name || '', color: c?.color || '#999999' }
  }

  const renderRequestCard = (request: typeof source[number]) => {
    const meta = getClubMeta(String(request.clubId || ''))
    const finalShown = typeof request.final_budget === 'number' ? request.final_budget : request.expected_budget
    return (
      <article
        key={request.id}
        className="border border-neutral-800 rounded-lg bg-neutral-950/60 p-5 space-y-3"
        style={{ borderLeft: `4px solid ${meta.color}` }}
      >
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: meta.color }} />
            <h3 className="text-lg font-semibold">{request.event_name}</h3>
          </div>
          {meta.name && <p className="text-xs text-muted">{meta.name}</p>}
          <p className="text-sm text-muted">Organisers: {request.organisers}</p>
        </header>

      <div className="grid gap-3 text-sm text-muted">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span>Requested: {formatInr(request.expected_budget)}</span>
        </div>
        {typeof finalShown === 'number' && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Final: {formatInr(finalShown)}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Planned month: {request.tentative_month}</span>
        </div>
        {request.createdAt && (
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <span
        className={`inline-flex text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border ${
          request.status === 'approved'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : request.status === 'rejected'
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : request.status === 'countered'
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
        }`}
      >
        {request.status}
      </span>
    </article>
  )}

  // Compute used distribution by club for approved/countered
  const totalBudget = stats.totalBudget ?? 1_000_000
  const usedByClub = new Map<string, { amount: number; name: string; color: string }>()
  for (const req of source) {
    if (req.status === 'approved' || req.status === 'countered') {
      const clubId = String(req.clubId ?? '')
      const meta = getClubMeta(clubId)
      const color = meta.color || '#6EE7B7'
      const name = meta.name
      const amt = typeof req.final_budget === 'number' ? req.final_budget : req.expected_budget || 0
      const entry = usedByClub.get(clubId) || { amount: 0, name, color }
      entry.amount += amt
      usedByClub.set(clubId, entry)
    }
  }

  const segments = Array.from(usedByClub.values())
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const totalUsed = segments.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} onLogout={logout} />

      <div className="lg:ml-64">
        <div className="p-6 space-y-8">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold">Budget oversight</h1>
            <p className="text-muted">Monitor spending approvals and plan the director&apos;s allocation.</p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="stat-card">
              <DollarSign className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Remaining director budget</p>
              <p className="text-2xl font-semibold">{formatInr(stats.remainingBudget)}</p>
            </div>
            <div className="stat-card">
              <ClipboardList className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Pending requests</p>
              <p className="text-2xl font-semibold">{pendingRequests.length}</p>
            </div>
            <div className="stat-card">
              <ClipboardList className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Approved</p>
              <p className="text-2xl font-semibold">{approvedRequests.length}</p>
            </div>
            <div className="stat-card">
              <ClipboardList className="h-6 w-6 mb-3" />
              <p className="text-sm text-muted">Rejected</p>
              <p className="text-2xl font-semibold">{rejectedRequests.length}</p>
            </div>
          </section>

          {/* Usage bar */}
          <section className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted">Budget used</p>
                {(() => {
                  const used = totalUsed
                  const pct = Math.round(Math.min(100, (used / totalBudget) * 100))
                  return (
                    <p className="text-lg font-semibold">{formatInr(used)} / {formatInr(totalBudget)} ({pct}%)</p>
                  )
                })()}
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
              <div className="w-full h-full relative">
                {segments.length === 0 ? (
                  <div className="h-full w-0" />
                ) : (
                  segments.map((seg, idx) => {
                    // If over budget, distribute 100% across segments proportionally to keep the bar accurate
                    const pct = totalUsed <= totalBudget
                      ? Math.max(0, Math.min(100, (seg.amount / totalBudget) * 100))
                      : Math.max(0, Math.min(100, (seg.amount / totalUsed) * 100))
                    return (
                      <div
                        key={idx}
                        className="h-full inline-block"
                        style={{ width: `${pct}%`, backgroundColor: seg.color || '#999' }}
                        title={`${seg.name}: ${formatInr(seg.amount)}`}
                      />
                    )
                  })
                )}
              </div>
            </div>
            {segments.length > 0 && (
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {segments
                  .filter((seg) => !!seg.name && seg.name.toLowerCase() !== 'unknown club')
                  .map((seg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color || '#999' }} />
                      <span>{seg.name}: {formatInr(seg.amount)}</span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-yellow-300" />
              <div>
                <h2 className="text-xl font-semibold">Pending review</h2>
                <p className="text-sm text-muted">Requests waiting on director approval or clarification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingRequests.length === 0 && (
                <div className="border border-neutral-800 rounded-lg p-6 text-center text-sm text-muted">
                  Every request has been handled. New submissions will appear here.
                </div>
              )}

              {pendingRequests.map(renderRequestCard)}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="text-xl font-semibold">Approved allocations</h2>
                <p className="text-sm text-muted">Funds already committed for upcoming events.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvedRequests.length === 0 && (
                <div className="border border-neutral-800 rounded-lg p-6 text-center text-sm text-muted">
                  No budget approvals yet.
                </div>
              )}

              {approvedRequests.map(renderRequestCard)}
            </div>
          </section>

          {rejectedRequests.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-red-400" />
                <div>
                  <h2 className="text-xl font-semibold">Rejected requests</h2>
                  <p className="text-sm text-muted">Submissions declined through the review process.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rejectedRequests.map(renderRequestCard)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
