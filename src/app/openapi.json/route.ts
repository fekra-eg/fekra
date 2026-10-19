import { openApi } from '@/lib/agent-discovery'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(openApi(), { headers: { 'Content-Type': 'application/openapi+json' } })
}
