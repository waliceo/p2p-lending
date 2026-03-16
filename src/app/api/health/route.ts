import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/health - Check database and auth connectivity
export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
  }

  // Check Prisma/DB connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'connected' }
  } catch (error) {
    checks.database = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check Supabase auth
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    checks.supabase = { 
      status: error ? 'no_session' : 'authenticated',
      userId: data?.user?.id || null,
      error: error?.message || null,
    }
  } catch (error) {
    checks.supabase = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const allGood = checks.database && (checks.database as { status: string }).status === 'connected'
  
  return NextResponse.json(checks, { 
    status: allGood ? 200 : 503 
  })
}
