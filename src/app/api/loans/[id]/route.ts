import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calculateRepaymentSchedule } from '@/lib/calculations'

// GET /api/loans/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        lender: { select: { id: true, fullName: true, email: true } },
        payments: { orderBy: { dueDate: 'asc' } },
        invitations: true,
      },
    })

    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    if (loan.borrowerId !== user.id && loan.lenderId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ loan })
  } catch (error) {
    console.error('Error fetching loan:', error)
    return NextResponse.json({ error: 'Failed to fetch loan' }, { status: 500 })
  }
}

// POST /api/loans/[id]/sign - Sign the loan
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

    const isBorrower = loan.borrowerId === user.id
    const isLender = loan.lenderId === user.id
    if (!isBorrower && !isLender) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update signature
    const updateData: Record<string, unknown> = {}
    if (isBorrower) updateData.borrowerSignedAt = new Date()
    if (isLender) updateData.lenderSignedAt = new Date()

    // Check if both parties have now signed
    const otherSigned = isBorrower ? loan.lenderSignedAt : loan.borrowerSignedAt
    if (otherSigned) {
      updateData.status = 'ACTIVE'
    } else if (loan.status === 'DRAFT') {
      updateData.status = 'PENDING_SIGNATURES'
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: updateData,
    })

    // If loan just became active, generate payment schedule
    if (updateData.status === 'ACTIVE' && loan.payments.length === 0) {
      const schedule = calculateRepaymentSchedule({
        amount: Number(loan.amount),
        interestRate: Number(loan.interestRate),
        repaymentFrequency: loan.repaymentFrequency,
        startDate: new Date(loan.startDate),
        endDate: new Date(loan.endDate),
      })

      await prisma.payment.createMany({
        data: schedule.map(payment => ({
          loanId: id,
          amountDue: payment.amountDue,
          dueDate: payment.dueDate,
          status: 'UPCOMING',
        })),
      })
    }

    return NextResponse.json({ loan: updatedLoan })
  } catch (error) {
    console.error('Error signing loan:', error)
    return NextResponse.json({ error: 'Failed to sign loan' }, { status: 500 })
  }
}
