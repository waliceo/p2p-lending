import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { loanSchema } from '@/lib/validations'
import { calculateRepaymentSchedule } from '@/lib/calculations'
import { RepaymentFrequency } from '@prisma/client'

// GET /api/loans - List user's loans
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const loans = await prisma.loan.findMany({
      where: {
        OR: [
          { borrowerId: user.id },
          { lenderId: user.id },
        ],
      },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        lender: { select: { id: true, fullName: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ loans })
  } catch (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

// POST /api/loans - Create a new loan
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = loanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { amount, interestRate, repaymentFrequency, startDate, endDate, gracePeriodDays, lateFeeAmount, notes, counterpartyEmail, initiatorRole } = parsed.data

    // Create the loan
    const loan = await prisma.loan.create({
      data: {
        borrowerId: initiatorRole === 'BORROWER' ? user.id : null,
        lenderId: initiatorRole === 'LENDER' ? user.id : null,
        amount,
        interestRate,
        repaymentFrequency: repaymentFrequency as RepaymentFrequency,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        gracePeriodDays,
        lateFeeAmount,
        notes,
        status: 'DRAFT',
      },
    })

    // Create invitation for the counterparty
    const invitationRole = initiatorRole === 'LENDER' ? 'BORROWER' : 'LENDER'
    await prisma.loanInvitation.create({
      data: {
        loanId: loan.id,
        inviterId: user.id,
        inviteeEmail: counterpartyEmail,
        role: invitationRole as 'BORROWER' | 'LENDER',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return NextResponse.json({ loan }, { status: 201 })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}
