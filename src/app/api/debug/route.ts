import { NextResponse } from 'next/server'

// GET /api/debug - Diagnostic endpoint to check production environment
export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }

  // Test Prisma import
  try {
    const { prisma } = await import('@/lib/prisma')
    checks.prismaImport = 'ok'
    
    // Test DB connection
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      checks.database = 'connected'
    } catch (dbError) {
      checks.database = {
        status: 'connection_failed',
        error: dbError instanceof Error ? dbError.message : String(dbError),
      }
    }
  } catch (importError) {
    checks.prismaImport = {
      status: 'failed',
      error: importError instanceof Error ? importError.message : String(importError),
      stack: importError instanceof Error ? importError.stack?.split('\n').slice(0, 5) : undefined,
    }
  }

  return NextResponse.json(checks, { status: 200 })
}
