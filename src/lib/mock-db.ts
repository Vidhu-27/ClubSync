import { Db } from 'mongodb'

// Mock data storage for development
const mockData: Record<string, any[]> = {
    clubs: [],
    users: [],
    budget_requests: [],
    events: [],
    reports: []
}

function seedMockDefaults() {
    mockData.clubs = [
        {
            _id: 'pending-1',
            id: 'pending-1',
            name: 'Arts Club',
            head: 'Jane Smith',
            description: 'Creative arts and culture',
            email: 'arts@mitwpu.edu.in',
            approved: false,
            color: null,
            contact_links: [],
            createdAt: new Date().toISOString(),
            approvedAt: null
        }
    ]
    mockData.users = []
    mockData.budget_requests = []
    mockData.events = []
    mockData.reports = []
}

export function resetMockDatabase() {
    seedMockDefaults()
    return { ...mockData }
}

export function createMockDatabase() {
    // Initialize with defaults if empty
    if (mockData.clubs.length === 0) {
        seedMockDefaults()
    }

    const mockDb = {
        collection: (name: string) => ({
            findOne: async (filter: any) => {
                const items = mockData[name] || []
                return items.find((item: any) => {
                    if (filter._id) return item._id === filter._id || item.id === filter._id
                    if (filter.id) return item.id === filter.id
                    if (filter.email) return item.email?.toLowerCase() === filter.email.toLowerCase()
                    return false
                }) || null
            },
            find: (filter?: any) => ({
                toArray: async () => {
                    const items = mockData[name] || []
                    if (!filter || Object.keys(filter).length === 0) return items
                    return items.filter((item: any) => {
                        return Object.entries(filter).every(([key, value]) => item[key] === value)
                    })
                }
            }),
            countDocuments: async (filter?: any) => {
                const items = mockData[name] || []
                if (!filter || Object.keys(filter).length === 0) return items.length
                return items.filter((item: any) => {
                    return Object.entries(filter).every(([key, value]) => item[key] === value)
                }).length
            },
            insertOne: async (doc: any) => {
                const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                const newDoc = { ...doc, _id: id, id }
                if (!mockData[name]) mockData[name] = []
                mockData[name].push(newDoc)
                return { insertedId: id }
            },
            updateOne: async (filter: any, update: any) => {
                const items = mockData[name] || []
                const index = items.findIndex((item: any) => {
                    if (filter._id) return item._id === filter._id || item.id === filter._id
                    if (filter.id) return item.id === filter.id
                    if (filter.email) return item.email?.toLowerCase() === filter.email.toLowerCase()
                    return false
                })

                if (index === -1) {
                    return { matchedCount: 0, modifiedCount: 0 }
                }

                // Apply $set operation
                if (update.$set) {
                    mockData[name][index] = { ...mockData[name][index], ...update.$set }
                }
                // Apply $push operation (arrays)
                if (update.$push) {
                    Object.entries(update.$push).forEach(([key, value]) => {
                        if (!Array.isArray((mockData as any)[name][index][key])) {
                            ; (mockData as any)[name][index][key] = []
                        }
                        ; (mockData as any)[name][index][key].push(value)
                    })
                }

                return { matchedCount: 1, modifiedCount: 1 }
            },
            deleteOne: async (filter: any) => {
                const items = mockData[name] || []
                const index = items.findIndex((item: any) => {
                    if (filter._id) return item._id === filter._id
                    if (filter.id) return item.id === filter.id
                    if (filter.email) return item.email === filter.email
                    return false
                })

                if (index === -1) {
                    return { deletedCount: 0 }
                }

                mockData[name].splice(index, 1)
                return { deletedCount: 1 }
            },
            deleteMany: async (filter: any) => {
                if (!filter || Object.keys(filter).length === 0) {
                    const count = (mockData[name] || []).length
                    mockData[name] = []
                    return { deletedCount: count }
                }
                return { deletedCount: 0 } // Minimal implementation
            }
        })
    }
    return { client: null, db: mockDb as unknown as Db }
}
