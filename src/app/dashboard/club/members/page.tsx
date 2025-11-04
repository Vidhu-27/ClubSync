'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Trash2, Edit3 } from 'lucide-react'

interface User {
  role: string
  email: string
  clubId: string
}

interface Club {
  id: string
  name: string
  members: Member[]
}

interface Member {
  name: string
  designation: string
}

export default function ClubMembersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', designation: '' })
  const router = useRouter()

  useEffect(() => {
    // Check authentication
  const token = localStorage.getItem('club_token')
    if (!token) {
      router.push('/')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({
        role: payload.role,
        email: payload.email,
        clubId: payload.clubId
      })
    } catch (error) {
      router.push('/')
      return
    }

    fetchClubData()
  }, [router])

  const fetchClubData = async () => {
    try {
  const token = localStorage.getItem('club_token')
      const response = await fetch('/api/dashboard/club', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setClub(data.club)
      }
    } catch (error) {
      console.error('Error fetching club data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMember.name.trim() || !newMember.designation.trim()) return

    try {
  const token = localStorage.getItem('club_token')
      const response = await fetch('/api/club/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMember)
      })

      if (response.ok) {
        setNewMember({ name: '', designation: '' })
        setShowAddForm(false)
        fetchClubData() // Refresh data
      }
    } catch (error) {
      console.error('Error adding member:', error)
    }
  }

  const handleRemoveMember = async (memberName: string, designation: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
  const token = localStorage.getItem('club_token')
      const response = await fetch('/api/club/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: memberName, designation })
      })

      if (response.ok) {
        fetchClubData() // Refresh data
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleLogout = () => {
  localStorage.removeItem('club_token')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !club) return null

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={{...user, clubName: club.name}} onLogout={handleLogout} />
      
      <div className="lg:ml-64">
        <div className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Club members</h1>
              <p className="text-muted">Add and maintain your club's core team.</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {showAddForm ? 'Close form' : 'Add member'}
            </button>
          </div>

          {showAddForm && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Add new member</h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Member name
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      className="input-field"
                      placeholder="Enter member name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={newMember.designation}
                      onChange={(e) => setNewMember({...newMember, designation: e.target.value})}
                      className="input-field"
                      placeholder="e.g., President, Secretary, Member"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Club members ({club.members.length})
            </h2>
            
            {club.members.length > 0 ? (
              <div className="space-y-4">
                {club.members.map((member, index) => (
                  <div key={index} className="border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{member.name}</h3>
                        <p className="text-sm text-muted">{member.designation}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveMember(member.name, member.designation)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No members yet</h3>
                <p className="text-muted mb-4">Start by adding your first club member</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary"
                >
                  Add First Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



