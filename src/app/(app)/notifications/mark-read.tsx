'use client'

import { useRouter } from 'next/navigation'
import { Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter()

  async function handleMarkRead() {
    await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' })
    router.refresh()
  }

  return (
    <button
      onClick={handleMarkRead}
      className="text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
      title="Mark as read"
    >
      <Check className="h-4 w-4" />
    </button>
  )
}

export function MarkAllReadButton() {
  const router = useRouter()

  async function handleMarkAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
      <CheckCheck className="h-4 w-4" />
      Mark all read
    </Button>
  )
}
