import { redirect } from 'next/navigation'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { MarkReadButton, MarkAllReadButton } from './mark-read'

const typeIcons: Record<string, string> = {
  PAYMENT_DUE_SOON: '⏰',
  PAYMENT_OVERDUE: '🚨',
  PAYMENT_RECEIVED: '✅',
  LOAN_INVITATION: '📨',
  LOAN_SIGNED: '✍️',
  LOAN_COMPLETED: '🎉',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-400" />
            Notifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No notifications yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.isRead ? 'opacity-60' : 'border-emerald-500/20'}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{typeIcons[notification.type] || '📋'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{formatDate(notification.createdAt)}</p>
                    </div>
                  </div>
                  {!notification.isRead && <MarkReadButton notificationId={notification.id} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
