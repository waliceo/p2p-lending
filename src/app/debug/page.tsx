import { headers } from 'next/headers'

async function getDebugInfo() {
  const info: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 25) + '...' : 'NOT SET',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  // Test Prisma
  try {
    const { PrismaClient } = await import('@prisma/client') as any
    info.prismaImport = 'ok'
    
    try {
      const prisma = new PrismaClient()
      await prisma.$queryRaw`SELECT 1`
      info.dbConnection = 'connected'
      await prisma.$disconnect()
    } catch (dbErr: any) {
      info.dbConnection = `FAILED: ${dbErr.message}`
    }
  } catch (importErr: any) {
    info.prismaImport = `FAILED: ${importErr.message}`
  }

  return info
}

export default async function DebugPage() {
  let debugInfo: Record<string, unknown>
  try {
    debugInfo = await getDebugInfo()
  } catch (err: any) {
    debugInfo = { error: err.message, stack: err.stack }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#111', color: '#0f0', minHeight: '100vh' }}>
      <h1>Debug Info</h1>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
