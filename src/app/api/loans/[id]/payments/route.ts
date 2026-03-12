import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { recordPaymentSchema } from '@/lib/validations'

// POST /api/loans/[id]/payments/record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = recordPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { amountPaid, paidDate, method, notes } = parsed.data

    // Verify loan access
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    })
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    if (loan.borrowerId !== user.id && loan.lenderId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find next unpaid payment
    const paymentId = body.paymentId
    let payment
    if (paymentId) {
      payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    } else {
      payment = await prisma.payment.findFirst({
        where: {
          loanId,
          status: { in: ['UPCOMING', 'DUE', 'LATE'] },
        },
        orderBy: { dueDate: 'asc' },
      })
    }

    if (!payment) {
      return NextResponse.json({ error: 'No pending payment found' }, { status: 404 })
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        amountPaid,
        paidDate: new Date(paidDate),
        method: method as 'MANUAL' | 'BANK_TRANSFER' | 'OTHER',
        notes,
        status: 'PAID',
      },
    })

    // Check if all payments are completed
    const remainingPayments = await prisma.payment.count({
      where: {
        loanId,
        status: { not: 'PAID' },
      },
    })

    if (remainingPayments === 0) {
      await prisma.loan.update({
        where: { id: loanId },
        data: { status: 'COMPLETED' },
      })
    }

    // Create notification for the other party
    const otherUserId = loan.borrowerId === user.id ? loan.lenderId : loan.borrowerId
    if (otherUserId) {
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          loanId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Recorded',
          message: `A payment of $${amountPaid.toFixed(2)} has been recorded.`,
        },
      })
    }

    return NextResponse.json({ payment: updatedPayment })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
