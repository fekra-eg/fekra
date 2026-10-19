import { SKILL_PATH, sha256, skillMarkdown } from '@/lib/agent-discovery'
import { siteUrl } from '@/lib/urls'

export const dynamic = 'force-static'

/** Agent Skills Discovery RFC v0.2.0. The digest is hashed from the exact text SKILL.md serves. */
export function GET() {
  return Response.json({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'fekra-site',
        type: 'skill-md',
        description: "Read FEKRA's website as markdown and find the right page to contact or hire them.",
        url: `${siteUrl()}${SKILL_PATH}`,
        digest: sha256(skillMarkdown()),
      },
    ],
  })
}
