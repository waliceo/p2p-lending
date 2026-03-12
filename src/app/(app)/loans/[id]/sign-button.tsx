'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SignLoanButton({ loanId }: { loanId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSign() {
    if (!confirm('Are you sure you want to sign this loan agreement? This action cannot be undone.')) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: 'POST',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error signing loan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSign} isLoading={isLoading}>
      <Check className="h-4 w-4" />
      Sign Agreement
    </Button>
  )
}
