'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const methodOptions = [
  { value: 'MANUAL', label: 'Manual / Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
]

export function RecordPaymentDialog({ loanId }: { loanId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState('MANUAL')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: parseFloat(amount),
          paidDate,
          method,
          notes,
        }),
      })

      if (res.ok) {
        setOpen(false)
        setAmount('')
        setNotes('')
        router.refresh()
      }
    } catch (error) {
      console.error('Error recording payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <DollarSign className="h-4 w-4" />
        Record Payment
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-2xl p-6 mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Record Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Amount Paid ($)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
          <Input
            label="Payment Date"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            required
          />
          <Select
            label="Payment Method"
            options={methodOptions}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
          <Input
            label="Notes (optional)"
            type="text"
            placeholder="Payment note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
