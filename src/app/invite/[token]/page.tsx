'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Handshake, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Invitation {
  id: string
  role: string
  loan: {
    id: string
    amount: string
    interestRate: string
    repaymentFrequency: string
    startDate: string
    endDate: string
    borrower?: { fullName: string }
    lender?: { fullName: string }
  }
  inviter: { fullName: string }
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/invitations/${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Invalid invitation')
        } else {
          setInvitation(data.invitation)
        }
      } catch {
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in - redirect to signup with return URL
          router.push(`/signup?redirect=/invite/${token}`)
          return
        }
        setError(data.error || 'Failed to accept invitation')
      } else {
        router.push(`/loans/${data.loanId}`)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
            <Handshake className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Loan Invitation</CardTitle>
          <CardDescription>
            {invitation.inviter.fullName} has invited you as the {invitation.role.toLowerCase()} on a loan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-slate-400">Amount</p>
              <p className="text-sm font-semibold text-white">{formatCurrency(invitation.loan.amount)}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-slate-400">Interest</p>
              <p className="text-sm font-semibold text-white">{invitation.loan.interestRate}%</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-slate-400">Your Role</p>
              <p className="text-sm font-semibold text-emerald-400">{invitation.role}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-slate-400">Frequency</p>
              <p className="text-sm font-semibold text-white">{invitation.loan.repaymentFrequency}</p>
            </div>
          </div>
          <Button className="w-full" onClick={handleAccept} isLoading={accepting}>
            <Check className="h-4 w-4" />
            Accept Invitation
          </Button>
          <p className="text-xs text-slate-500 text-center">
            By accepting, you agree to be part of this loan agreement.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
