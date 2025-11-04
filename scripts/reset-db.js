// Reset the database to stock app state.
// - If MongoDB is reachable (MONGODB_URI, MONGODB_DB), clears key collections and seeds default pending club.
// - If MongoDB is NOT reachable, optionally call the dev reset API if the dev server is running.

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const MONGODB_DB = process.env.MONGODB_DB || 'clubsync'

async function resetMongo() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 })
  await client.connect()
  const db = client.db(MONGODB_DB)

  const collections = ['clubs', 'users', 'budget_requests', 'events']
  for (const name of collections) {
    try {
      await db.collection(name).deleteMany({})
      console.log(`Cleared collection: ${name}`)
    } catch (e) {
      console.warn(`Skip clearing ${name}:`, e.message)
    }
  }

  await db.collection('clubs').insertOne({
    name: 'Arts Club',
    head: 'Jane Smith',
    description: 'Creative arts and culture',
    email: 'arts@mitwpu.edu.in',
    approved: false,
    color: null,
    contact_links: [],
    createdAt: new Date().toISOString(),
    approvedAt: null,
    members: [],
    events: []
  })

  console.log('Seeded stock pending club: Arts Club')
  await client.close()
}

async function main() {
  try {
    await resetMongo()
    console.log('Reset complete (mongo)')
  } catch (e) {
    console.warn('Mongo not available or reset failed, attempting dev API...')
    try {
      const url = process.env.RESET_API_URL || 'http://localhost:3000/api/dev/reset'
      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      console.log('Dev API reset result:', body)
    } catch (apiErr) {
      console.error('Dev API reset failed. If you are using the in-memory mock DB, restart the dev server to reset state.')
      console.error(apiErr.message)
      process.exit(1)
    }
  }
}

// Node 18+ has global fetch
main()
  .catch((e) => {
    console.error('Reset failed:', e)
    process.exit(1)
  })
