import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PlusCircle, ArrowUpRight, ArrowDownLeft, Clock, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, getLoanStatusBadge, getPaymentStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    // Fetch user's loans
    const rawLoans = await prisma.loan.findMany({
      where: {
        OR: [
          { borrowerId: user.id },
          { lenderId: user.id },
        ],
      },
      include: {
        borrower: true,
        lender: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Convert Prisma Decimal objects to plain values for RSC serialization
    const loans = JSON.parse(JSON.stringify(rawLoans)) as typeof rawLoans

    // Calculate stats
    const activeLoans = loans.filter(l => l.status === 'ACTIVE')
    const totalLent = loans
      .filter(l => l.lenderId === user.id && l.status === 'ACTIVE')
      .reduce((sum, l) => sum + Number(l.amount), 0)
    const totalBorrowed = loans
      .filter(l => l.borrowerId === user.id && l.status === 'ACTIVE')
      .reduce((sum, l) => sum + Number(l.amount), 0)

    // Find upcoming payments
    const allPayments = loans.flatMap(loan =>
      loan.payments
        .filter(p => p.status === 'UPCOMING' || p.status === 'DUE' || p.status === 'LATE')
        .map(p => ({ ...p, loan }))
    )
    allPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    const upcomingPayments = allPayments.slice(0, 5)

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Welcome back! Here&apos;s your lending overview.</p>
          </div>
          <Link href="/loans/new">
            <Button>
              <PlusCircle className="h-4 w-4" />
              New Loan
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Loans</p>
                  <p className="text-2xl font-bold text-white mt-1">{activeLoans.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Lent</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalLent)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Borrowed</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBorrowed)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Upcoming Payments</p>
                  <p className="text-2xl font-bold text-white mt-1">{upcomingPayments.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No upcoming payments</p>
              ) : (
                <div className="space-y-3">
                  {upcomingPayments.map((payment) => {
                    const statusBadge = getPaymentStatusBadge(payment.status)
                    const isLender = payment.loan.lenderId === user.id
                    return (
                      <Link
                        key={payment.id}
                        href={`/loans/${payment.loan.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isLender ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                            {isLender ? <ArrowDownLeft className="h-5 w-5 text-blue-400" /> : <ArrowUpRight className="h-5 w-5 text-amber-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {isLender ? `From ${payment.loan.borrower?.fullName || 'Pending'}` : `To ${payment.loan.lender?.fullName || 'Pending'}`}
                            </p>
                            <p className="text-xs text-slate-400">{formatDate(payment.dueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{formatCurrency(payment.amountDue)}</p>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Your Loans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-4">No loans yet</p>
                  <Link href="/loans/new">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4" />
                      Create Your First Loan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {loans.slice(0, 5).map((loan) => {
                    const statusBadge = getLoanStatusBadge(loan.status)
                    const isLender = loan.lenderId === user.id
                    const otherParty = isLender ? loan.borrower : loan.lender
                    return (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isLender ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                            {isLender ? <ArrowUpRight className="h-5 w-5 text-blue-400" /> : <ArrowDownLeft className="h-5 w-5 text-amber-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {isLender ? 'Lent to' : 'Borrowed from'} {otherParty?.fullName || 'Pending'}
                            </p>
                            <p className="text-xs text-slate-400">{formatDate(loan.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{formatCurrency(loan.amount)}</p>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Empty state for brand new users */}
        {loans.length === 0 && (
          <Card className="glow-emerald">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to get started?</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  Create your first loan agreement. Whether you&apos;re lending or borrowing, we&apos;ll help you set up everything with clear terms and automatic tracking.
                </p>
                <Link href="/loans/new">
                  <Button size="lg">
                    <PlusCircle className="h-5 w-5" />
                    Create Your First Loan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error('Dashboard render error:', error)
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back!</p>
        </div>
        <Card className="border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Unable to load dashboard data</h2>
            </div>
            <p className="text-slate-400 text-sm mb-2">
              There was an error connecting to the database. Please try refreshing the page.
            </p>
            <p className="text-slate-500 text-xs font-mono">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
