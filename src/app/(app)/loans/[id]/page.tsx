import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Check, Clock, DollarSign, Calendar, Percent, FileText, Users, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, getLoanStatusBadge, getPaymentStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import { calculateLoanStats } from '@/lib/calculations'
import { SignLoanButton } from './sign-button'
import { RecordPaymentDialog } from './record-payment'

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawLoan = await prisma.loan.findUnique({
    where: { id },
    include: {
      borrower: { select: { id: true, fullName: true, email: true } },
      lender: { select: { id: true, fullName: true, email: true } },
      payments: { orderBy: { dueDate: 'asc' } },
      invitations: true,
    },
  })

  // Convert Prisma Decimal objects to plain values for RSC serialization
  const loan = rawLoan ? JSON.parse(JSON.stringify(rawLoan)) as typeof rawLoan : null

  if (!loan || (loan.borrowerId !== user.id && loan.lenderId !== user.id)) {
    redirect('/dashboard')
  }

  const isLender = loan.lenderId === user.id
  const isBorrower = loan.borrowerId === user.id
  const statusBadge = getLoanStatusBadge(loan.status)
  const stats = calculateLoanStats(loan.payments.map(p => ({
    amountDue: Number(p.amountDue),
    amountPaid: Number(p.amountPaid),
    status: p.status,
  })))

  const canSign = (isBorrower && !loan.borrowerSignedAt) || (isLender && !loan.lenderSignedAt)
  const hasPendingPayments = loan.payments.some(p => ['UPCOMING', 'DUE', 'LATE'].includes(p.status))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {formatCurrency(loan.amount)} Loan
              </h1>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {isLender ? `Lending to ${loan.borrower?.fullName || 'Pending'}` : `Borrowing from ${loan.lender?.fullName || 'Pending'}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSign && <SignLoanButton loanId={loan.id} />}
        </div>
      </div>

      {/* Signing status banner */}
      {loan.status === 'PENDING_SIGNATURES' && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-400">Awaiting Signatures</p>
                <p className="text-xs text-amber-400/70">
                  {loan.borrowerSignedAt ? 'Borrower has signed. ' : 'Borrower has not signed. '}
                  {loan.lenderSignedAt ? 'Lender has signed.' : 'Lender has not signed.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Loan Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Principal</span>
              <span className="text-sm font-medium text-white">{formatCurrency(loan.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Interest Rate</span>
              <span className="text-sm font-medium text-white">{formatPercent(Number(loan.interestRate))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Frequency</span>
              <span className="text-sm font-medium text-white">{loan.repaymentFrequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Grace Period</span>
              <span className="text-sm font-medium text-white">{loan.gracePeriodDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Late Fee</span>
              <span className="text-sm font-medium text-white">{formatCurrency(loan.lateFeeAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Start Date</span>
              <span className="text-sm font-medium text-white">{formatDate(loan.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">End Date</span>
              <span className="text-sm font-medium text-white">{formatDate(loan.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Created</span>
              <span className="text-sm font-medium text-white">{formatDate(loan.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Parties</span>
              <span className="text-sm font-medium text-white">
                {loan.lender?.fullName || 'Pending'} → {loan.borrower?.fullName || 'Pending'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {loan.status === 'ACTIVE' && loan.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-400" />
              Repayment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{formatCurrency(stats.totalPaid)} paid</span>
              <span className="text-slate-400">{formatCurrency(stats.totalAmount)} total</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="progress-bar h-full" style={{ width: `${stats.progressPercent}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">{stats.completedPayments}/{stats.totalPayments}</p>
                <p className="text-xs text-slate-400">Payments Made</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.remainingBalance)}</p>
                <p className="text-xs text-slate-400">Remaining</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.progressPercent}%</p>
                <p className="text-xs text-slate-400">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule */}
      {loan.payments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              Payment Schedule
            </CardTitle>
            {hasPendingPayments && (
              <RecordPaymentDialog loanId={loan.id} />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loan.payments.map((payment) => {
                const pBadge = getPaymentStatusBadge(payment.status)
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${payment.status === 'PAID' ? 'bg-emerald-500/10' : 'bg-slate-700/50'}`}>
                        {payment.status === 'PAID' ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{formatCurrency(payment.amountDue)}</p>
                        <p className="text-xs text-slate-400">Due {formatDate(payment.dueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {payment.status === 'PAID' && (
                        <p className="text-xs text-slate-400 mb-1">Paid {formatDate(payment.paidDate!)}</p>
                      )}
                      <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {loan.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{loan.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
