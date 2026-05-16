import { NextResponse } from 'next/server'

export async function GET() {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME

  if (!evolutionUrl || !evolutionKey || !instanceName) {
    return NextResponse.json({ connected: false, error: 'Missing config' })
  }

  try {
    const res = await fetch(
      `${evolutionUrl}/instance/connectionState/${instanceName}`,
      {
        headers: { apikey: evolutionKey },
        signal: AbortSignal.timeout(5000),
      }
    )
    const data = await res.json()
    const connected = data?.instance?.state === 'open'
    return NextResponse.json({ connected })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
