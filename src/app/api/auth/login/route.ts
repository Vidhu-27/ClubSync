import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const DEFAULT_DIRECTOR_EMAIL = (process.env.DEFAULT_DIRECTOR_EMAIL || 'director@mitwpu.edu.in').toLowerCase()
const DEFAULT_DIRECTOR_PASSWORD = process.env.DEFAULT_DIRECTOR_PASSWORD || 'Director@123'

const FALLBACK_USERS = [
  { email: 'director@mitwpu.edu.in', password: 'Director@123', role: 'director' as const },
  { email: 'club@mitwpu.edu.in', password: 'Club@123', role: 'club' as const, clubId: 'mock-club-id' },
  { email: 'tech@mitwpu.edu.in', password: 'Tech@123', role: 'club' as const, clubId: 'club-1' },
  { email: 'arts@mitwpu.edu.in', password: 'Arts@123', role: 'club' as const, clubId: 'pending-1' }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()

    if (!normalizedEmail.endsWith('@mitwpu.edu.in')) {
      return NextResponse.json(
        { message: 'Use your college email (@mitwpu.edu.in)' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    let user = await db.collection('users').findOne({ email: normalizedEmail })

    if (!user && normalizedEmail === DEFAULT_DIRECTOR_EMAIL) {
      const hashedPassword = await bcrypt.hash(DEFAULT_DIRECTOR_PASSWORD, 12)
      const insertResult = await db.collection('users').insertOne({
        email: DEFAULT_DIRECTOR_EMAIL,
        password: hashedPassword,
        role: 'director',
        createdAt: new Date()
      })

      user = {
        _id: insertResult.insertedId,
        email: DEFAULT_DIRECTOR_EMAIL,
        password: hashedPassword,
        role: 'director',
        createdAt: new Date()
      }
    }

    if (!user) {
      const fallbackUser = FALLBACK_USERS.find((fallback) => fallback.email === normalizedEmail)
      if (fallbackUser && fallbackUser.password === password) {
        const token = jwt.sign(
          {
            userId: fallbackUser.email,
            email: fallbackUser.email,
            role: fallbackUser.role,
            clubId: fallbackUser.clubId ?? null
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        )

        return NextResponse.json({
          message: 'Login successful',
          token,
          user: {
            id: fallbackUser.email,
            email: fallbackUser.email,
            role: fallbackUser.role,
            clubId: fallbackUser.clubId ?? null
          }
        })
      }

      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.role === 'club') {
      const club = await db.collection('clubs').findOne({ email: normalizedEmail })
      if (!club || !club.approved) {
        return NextResponse.json(
          { message: 'Club not approved yet' },
          { status: 403 }
        )
      }

      if (!user.clubId && club._id) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { clubId: club._id.toString() } }
        )
        user.clubId = club._id.toString()
      }
    }

    const token = jwt.sign(
      {
        userId: typeof user._id === 'string' ? user._id : user._id?.toString?.(),
        email: user.email,
        role: user.role,
        clubId: user.clubId ?? null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: typeof user._id === 'string' ? user._id : user._id?.toString?.(),
        email: user.email,
        role: user.role,
        clubId: user.clubId ?? null
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

