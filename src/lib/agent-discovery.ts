import { createHash } from 'crypto'

import { siteUrl } from '@/lib/urls'

/**
 * Agent discovery documents (isitagentready.com). Everything here describes
 * what an agent can actually use without a browser: markdown versions of every
 * page and the health probe. The contact/newsletter APIs sit behind Turnstile,
 * so advertising them would only hand agents a guaranteed failure.
 */

export const SKILL_PATH = '/.well-known/agent-skills/fekra-site/SKILL.md'

export function skillMarkdown(): string {
  const base = siteUrl()
  return `---
name: fekra-site
description: Read FEKRA's website (software engineering talent and delivery teams) as markdown and find the right page to contact or hire them.
---

# FEKRA website

FEKRA (${base}) provides software engineering talent and dedicated delivery teams.

## Reading pages

Request any page with \`Accept: text/markdown\` to get a markdown version of its main content:

\`\`\`
curl -H "Accept: text/markdown" ${base}/services
\`\`\`

English is unprefixed; Arabic lives under \`/ar\`. The full page list is in ${base}/sitemap.xml.

## Useful pages

- Services: ${base}/services
- Open jobs: ${base}/careers
- Blog: ${base}/blog
- Contact form: ${base}/contact
- Book a 30-minute meeting: ${base}/meeting

## Contacting FEKRA

The contact, newsletter and job application forms are protected by a CAPTCHA, so they cannot be
submitted programmatically. Send the user to ${base}/contact or ${base}/meeting instead.
`
}

export const sha256 = (text: string) => `sha256:${createHash('sha256').update(text).digest('hex')}`

export function openApi() {
  const base = siteUrl()
  return {
    openapi: '3.1.0',
    info: { title: 'FEKRA website', version: '1.0.0', description: 'Read-only access to fekra-egy.com for agents.' },
    servers: [{ url: base }],
    paths: {
      '/{path}': {
        get: {
          summary: 'Any site page as markdown',
          description: 'Send `Accept: text/markdown` to receive the main content of a page as markdown. Paths are listed in /sitemap.xml.',
          parameters: [
            { name: 'path', in: 'path', required: true, schema: { type: 'string' }, example: 'services' },
            { name: 'Accept', in: 'header', required: true, schema: { type: 'string', const: 'text/markdown' } },
          ],
          responses: {
            '200': { description: 'Markdown page', content: { 'text/markdown': { schema: { type: 'string' } } } },
            '404': { description: 'No such page' },
          },
        },
      },
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': { description: 'Healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { const: 'ok' } } } } } },
            '503': { description: 'Degraded' },
          },
        },
      },
    },
  }
}
