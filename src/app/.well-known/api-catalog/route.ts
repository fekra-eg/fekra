import { SKILL_PATH } from '@/lib/agent-discovery'
import { siteUrl } from '@/lib/urls'

export const dynamic = 'force-static'

/** RFC 9727 API catalog. */
export function GET() {
  const base = siteUrl()
  return Response.json(
    {
      linkset: [
        {
          anchor: `${base}/`,
          'service-desc': [{ href: `${base}/openapi.json`, type: 'application/openapi+json' }],
          'service-doc': [{ href: `${base}${SKILL_PATH}`, type: 'text/markdown' }],
          status: [{ href: `${base}/api/health`, type: 'application/json' }],
        },
      ],
    },
    { headers: { 'Content-Type': 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"' } },
  )
}
