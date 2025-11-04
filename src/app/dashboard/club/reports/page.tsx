'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Download, Trash2 } from 'lucide-react'

type User = { role: string; email: string; clubId: string }

type Report = {
  id: string
  club_id: string
  title: string
  original_name: string
  mime: string
  size: number
  url: string
  uploadedAt?: string
}

export default function ClubReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('club_token')
    if (!token) { router.push('/'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ role: payload.role, email: payload.email, clubId: payload.clubId })
      fetchReports(token)
    } catch {
      router.push('/')
    }
  }, [router])

  const fetchReports = async (token: string) => {
    try {
      const res = await fetch('/api/club/reports', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setReports(data.reports || [])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async () => {
    const token = localStorage.getItem('club_token')
    if (!token || !file) return
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    const res = await fetch('/api/club/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    })
    if (res.ok) {
      setFile(null)
      setTitle('')
      await fetchReports(token)
    }
  }

  const deleteReport = async (id: string) => {
    const token = localStorage.getItem('club_token')
    if (!token) return
    const res = await fetch(`/api/club/reports?id=${encodeURIComponent(id)}` , {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      await fetchReports(token)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} onLogout={() => { localStorage.removeItem('club_token'); router.push('/') }} />
      <div className="lg:ml-64">
        <div className="p-6 space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold flex items-center gap-2"><FileText className="w-7 h-7" /> Reports</h1>
            <p className="text-sm text-muted">Upload club reports (PDF, DOC, DOCX) and access your history.</p>
          </header>

          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Upload className="w-5 h-5" /> Upload a report</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input type="text" className="input" placeholder="Optional title"
                     value={title} onChange={(e) => setTitle(e.target.value)} />
              <input type="file" className="input" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                     onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button className="btn-primary" onClick={handleUpload} disabled={!file}>Upload</button>
            </div>
            <p className="text-xs text-muted">Max few MBs; stored locally under uploads for development.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Previously uploaded</h2>
            {reports.length === 0 && (
              <div className="border border-neutral-800 rounded-lg p-6 text-sm text-muted">No reports yet. Upload your first report above.</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((r) => (
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
                  <div className="flex justify-end">
                    <button className="btn-secondary text-red-300 hover:text-red-200 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={() => deleteReport(r.id)}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
