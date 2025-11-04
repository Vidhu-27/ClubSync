import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, club_name, head, description, contact_links } = await request.json()

    // Validation
    if (!email || !password || !club_name || !head || !description) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    if (!email.endsWith('@mitwpu.edu.in')) {
      return NextResponse.json(
        { message: 'Use your college email (@mitwpu.edu.in)' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if club name already exists
    const existingClub = await db.collection('clubs').findOne({ name: club_name })
    if (existingClub) {
      return NextResponse.json(
        { message: 'Club name already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Parse contact links
    let parsedContactLinks: string[] = []
    if (contact_links && contact_links.trim()) {
      parsedContactLinks = contact_links
        .split(',')
        .map((link: string) => link.trim())
        .filter((link: string) => link.length > 0)
    }

    // Create user
    const userResult = await db.collection('users').insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'club',
      club_name: club_name,
      createdAt: new Date()
    })

    // Create club (pending approval)
    const clubResult = await db.collection('clubs').insertOne({
      name: club_name,
      head: head,
      description: description,
      color: null, // Will be assigned on approval
      members: [],
      events: [],
      approved: false,
      email: email.toLowerCase(),
      contact_links: parsedContactLinks,
      createdAt: new Date()
    })

    // Update user with club ID
    await db.collection('users').updateOne(
      { _id: userResult.insertedId },
      { $set: { clubId: clubResult.insertedId.toString() } }
    )

    return NextResponse.json({
      message: 'Registration submitted successfully. Wait for director approval.',
      success: true
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}