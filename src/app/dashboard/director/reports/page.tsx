'use client'

import Sidebar from '@/components/Sidebar'
import { useDirectorDashboard } from '@/hooks/useDirectorDashboard'
import { useEffect, useState } from 'react'
import { FileText, Folder, Download, ChevronDown, ChevronRight } from 'lucide-react'

type Club = { id: string; name: string; color?: string }
type Report = { id: string; title: string; original_name: string; mime: string; size: number; url: string; uploadedAt?: string }

export default function DirectorReportsPage() {
  const { user, logout } = useDirectorDashboard()
  const [clubs, setClubs] = useState<Club[]>([])
  const [reportsByClub, setReportsByClub] = useState<Record<string, Report[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('director_token') : null
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/director/reports', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) {
        setClubs(data.clubs || [])
        setReportsByClub(data.reportsByClub || {})
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const onVis = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (!user) return null

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} onLogout={logout} />
      <div className="lg:ml-64">
        <div className="p-6 space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold flex items-center gap-2"><FileText className="w-7 h-7" /> Reports</h1>
            <p className="text-sm text-muted">Browse and download reports submitted by all clubs.</p>
          </header>

          <div className="flex items-center justify-between">
            <div />
            <button className="btn-secondary" onClick={fetchAll}>Refresh</button>
          </div>

          {isLoading && (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}

          {!isLoading && (
            <section className="space-y-3">
              {clubs.length === 0 && (
                <div className="border border-neutral-800 rounded-lg p-6 text-sm text-muted">No clubs found.</div>
              )}
              <div className="space-y-2">
                {clubs.map((club) => {
                  const list = reportsByClub[club.id] || reportsByClub[String(club.id)] || []
                  const isOpen = !!expanded[club.id]
                  return (
                    <div key={club.id} className="border border-neutral-800 rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 bg-neutral-950/60 hover:bg-neutral-900/50 transition"
                        onClick={() => setExpanded((e) => ({ ...e, [club.id]: !isOpen }))}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: club.color || '#999' }} />
                          <span className="font-semibold">{club.name}</span>
                          <span className="text-xs text-muted">{list.length} {list.length === 1 ? 'report' : 'reports'}</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {list.length === 0 && (
                            <div className="text-sm text-muted">No reports uploaded by this club yet.</div>
                          )}
                          {list.map((r) => (
                            <article key={r.id} className="border border-neutral-800 rounded-lg p-4 bg-neutral-950/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold truncate" title={r.title || r.original_name}>{r.title || r.original_name}</div>
                                <a className="text-sm underline flex items-center gap-1" href={r.url} target="_blank" rel="noreferrer">
                                  <Download className="w-4 h-4" /> Download
                                </a>
                              </div>
                              <div className="text-xs text-muted">
                                <span>{r.mime}</span>
                                <span className="mx-2">•</span>
                                <span>{(r.size / 1024).toFixed(1)} KB</span>
                                {r.uploadedAt && <><span className="mx-2">•</span><span>{new Date(r.uploadedAt).toLocaleString()}</span></>}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
