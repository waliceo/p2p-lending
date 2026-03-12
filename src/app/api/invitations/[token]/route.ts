import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/invitations/[token]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const invitation = await prisma.loanInvitation.findUnique({
      where: { token },
      include: {
        loan: {
          include: {
            borrower: { select: { fullName: true } },
            lender: { select: { fullName: true } },
          },
        },
        inviter: { select: { fullName: true } },
      },
    })

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    if (invitation.status !== 'PENDING') return NextResponse.json({ error: 'Invitation already used' }, { status: 400 })
    if (new Date() > invitation.expiresAt) return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST /api/invitations/[token]/accept
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign up or log in first' }, { status: 401 })

    const invitation = await prisma.loanInvitation.findUnique({
      where: { token },
      include: { loan: true },
    })

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    if (invitation.status !== 'PENDING') return NextResponse.json({ error: 'Invitation already used' }, { status: 400 })
    if (new Date() > invitation.expiresAt) return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })

    // Ensure user profile exists
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name || user.email!.split('@')[0],
      },
    })

    // Assign the user to the loan
    const loanUpdate: Record<string, string> = {}
    if (invitation.role === 'BORROWER') loanUpdate.borrowerId = user.id
    if (invitation.role === 'LENDER') loanUpdate.lenderId = user.id

    await prisma.loan.update({
      where: { id: invitation.loanId },
      data: {
        ...loanUpdate,
        status: 'PENDING_SIGNATURES',
      },
    })

    // Mark invitation as accepted
    await prisma.loanInvitation.update({
      where: { token },
      data: { status: 'ACCEPTED' },
    })

    // Notify the inviter
    await prisma.notification.create({
      data: {
        userId: invitation.inviterId,
        loanId: invitation.loanId,
        type: 'LOAN_INVITATION',
        title: 'Invitation Accepted',
        message: `${user.email} has accepted your loan invitation.`,
      },
    })

    return NextResponse.json({ loanId: invitation.loanId })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
