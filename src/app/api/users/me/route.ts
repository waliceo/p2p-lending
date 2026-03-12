import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/me
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let user = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!user) {
      // Auto-create profile if missing
      user = await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email!,
          fullName: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
        },
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/users/me
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { fullName, phone } = await request.json()

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
