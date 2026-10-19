import { skillMarkdown } from '@/lib/agent-discovery'

export const dynamic = 'force-static'

export function GET() {
  return new Response(skillMarkdown(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
