import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/database'
import { env } from '@/lib/env'

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

    // Find user in DB
    const user = await db.collection('users').findOne({ email: normalizedEmail })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Additional checks for clubs
    if (user.role === 'club') {
      const club = await db.collection('clubs').findOne({ email: normalizedEmail })
      if (!club || !club.approved) {
        return NextResponse.json(
          { message: 'Club not approved yet' },
          { status: 403 }
        )
      }

      // Sync clubId if missing in user record
      if (!user.clubId && club._id) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { clubId: club._id.toString() } }
        )
        user.clubId = club._id.toString()
      }
    }

    // Generate Token
    const token = jwt.sign(
      {
        userId: typeof user._id === 'string' ? user._id : user._id?.toString?.(),
        email: user.email,
        role: user.role,
        clubId: user.clubId ?? null
      },
      env.JWT_SECRET,
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

