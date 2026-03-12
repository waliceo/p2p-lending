'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, DollarSign, Calendar, Percent, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const frequencyOptions = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 Weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
]

const roleOptions = [
  { value: 'LENDER', label: "I'm lending money" },
  { value: 'BORROWER', label: "I'm borrowing money" },
]

export default function NewLoanPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    initiatorRole: 'LENDER',
    counterpartyEmail: '',
    amount: '',
    interestRate: '0',
    repaymentFrequency: 'MONTHLY',
    startDate: '',
    endDate: '',
    gracePeriodDays: '0',
    lateFeeAmount: '0',
    notes: '',
  })

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          interestRate: parseFloat(formData.interestRate),
          gracePeriodDays: parseInt(formData.gracePeriodDays),
          lateFeeAmount: parseFloat(formData.lateFeeAmount),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create loan')
        return
      }

      router.push(`/loans/${data.loan.id}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate preview
  const amount = parseFloat(formData.amount) || 0
  const rate = parseFloat(formData.interestRate) || 0
  const start = formData.startDate ? new Date(formData.startDate) : null
  const end = formData.endDate ? new Date(formData.endDate) : null
  const termMonths = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0
  const totalInterest = amount * (rate / 100) * (termMonths / 12)
  const totalRepayment = amount + totalInterest

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Loan</h1>
          <p className="text-slate-400 text-sm">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="progress-bar h-full" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Your Role & Counterparty */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Who&apos;s involved?
            </CardTitle>
            <CardDescription>Tell us your role and who the other party is.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Your Role"
              options={roleOptions}
              value={formData.initiatorRole}
              onChange={(e) => updateField('initiatorRole', e.target.value)}
            />
            <Input
              label={formData.initiatorRole === 'LENDER' ? "Borrower's Email" : "Lender's Email"}
              type="email"
              placeholder="friend@example.com"
              value={formData.counterpartyEmail}
              onChange={(e) => updateField('counterpartyEmail', e.target.value)}
            />
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.counterpartyEmail}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Loan Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Loan Details
            </CardTitle>
            <CardDescription>Set the amount, interest, and repayment terms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Loan Amount ($)"
              type="number"
              placeholder="1000"
              value={formData.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              min="1"
              step="0.01"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Interest Rate (%)"
                type="number"
                placeholder="0"
                value={formData.interestRate}
                onChange={(e) => updateField('interestRate', e.target.value)}
                min="0"
                max="100"
                step="0.01"
              />
              <Select
                label="Repayment Frequency"
                options={frequencyOptions}
                value={formData.repaymentFrequency}
                onChange={(e) => updateField('repaymentFrequency', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Grace Period (days)"
                type="number"
                placeholder="0"
                value={formData.gracePeriodDays}
                onChange={(e) => updateField('gracePeriodDays', e.target.value)}
                min="0"
              />
              <Input
                label="Late Fee ($)"
                type="number"
                placeholder="0"
                value={formData.lateFeeAmount}
                onChange={(e) => updateField('lateFeeAmount', e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.amount || !formData.startDate || !formData.endDate}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-emerald-400" />
              Review & Create
            </CardTitle>
            <CardDescription>Review the loan terms before creating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Your Role</p>
                <p className="text-sm font-semibold text-white">
                  {formData.initiatorRole === 'LENDER' ? 'Lender' : 'Borrower'}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Other Party</p>
                <p className="text-sm font-semibold text-white truncate">{formData.counterpartyEmail}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Loan Amount</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(amount)}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Interest Rate</p>
                <p className="text-sm font-semibold text-white">{rate}%</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Total Interest</p>
                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(totalInterest)}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Total Repayment</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(totalRepayment)}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Start Date</p>
                <p className="text-sm font-semibold text-white">{formData.startDate}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">End Date</p>
                <p className="text-sm font-semibold text-white">{formData.endDate}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Frequency</p>
                <p className="text-sm font-semibold text-white">{formData.repaymentFrequency}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Grace Period</p>
                <p className="text-sm font-semibold text-white">{formData.gracePeriodDays} days</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Notes (optional)</label>
              <textarea
                className="flex w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-h-[80px] resize-none"
                placeholder="Any additional notes about this loan..."
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} isLoading={isLoading}>
                Create Loan & Send Invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
