import { MongoClient, Db } from 'mongodb'
import { env } from '@/lib/env'
import { createMockDatabase } from '@/lib/mock-db'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null
let usingMock = false

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  try {
    const client = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000, // 3 second timeout
      connectTimeoutMS: 3000,
    })
    await client.connect()

    const db = client.db(env.MONGODB_DB)

    cachedClient = client
    cachedDb = db
    usingMock = false

    return { client, db }
  } catch (error) {
    console.error('Database connection error:', error)

    // Only allow mock if explicitly enabled in env
    if (env.ALLOW_DB_MOCK === 'true') {
      console.warn('⚠️ Using mock database for development (ALLOW_DB_MOCK=true)')
      usingMock = true
      return createMockDatabase()
    }

    // Otherwise rethrow
    throw error
  }
}

export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
  }
}

export function isUsingMockDb() {
  return usingMock
}


