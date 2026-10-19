import { SKILL_PATH } from '@/lib/agent-discovery'
import { siteUrl } from '@/lib/urls'

export const dynamic = 'force-static'

/** ARD / ai-catalog manifest. */
export function GET() {
  const base = siteUrl()
  const host = new URL(base).hostname
  return Response.json(
    {
      specVersion: '1.0',
      host: { displayName: 'FEKRA', identifier: `did:web:${host}` },
      entries: [
        {
          identifier: `urn:air:${host}:skill:fekra-site`,
          displayName: 'FEKRA website skill',
          type: 'text/markdown',
          url: `${base}${SKILL_PATH}`,
          representativeQueries: [
            'hire a dedicated software engineering team in Egypt',
            'what services does FEKRA offer',
            'open software engineering jobs at FEKRA',
          ],
        },
        {
          identifier: `urn:air:${host}:api:site`,
          displayName: 'FEKRA website (markdown pages)',
          type: 'application/linkset+json',
          url: `${base}/.well-known/api-catalog`,
          representativeQueries: [
            'read fekra-egy.com pages as markdown',
            'FEKRA staff augmentation services details',
          ],
        },
      ],
    },
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  )
}
