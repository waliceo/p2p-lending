import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { id, email, fullName } = await request.json()

    if (!id || !email || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user profile in Prisma
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, fullName },
      create: {
        id,
        email,
        fullName,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
