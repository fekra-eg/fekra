'use client'

import { useEffect } from 'react'

type ModelContext = {
  registerTool: (tool: {
    name: string
    description: string
    inputSchema: object
    execute: (input: Record<string, string>) => Promise<unknown>
  }, options?: { signal?: AbortSignal }) => Promise<void>
}

const PAGES = { home: '', services: '/services', careers: '/careers', blog: '/blog', contact: '/contact', meeting: '/meeting' }

/** WebMCP (webmachinelearning.github.io/webmcp): site navigation and markdown reading for in-browser agents. */
export function WebMcpTools({ localePrefix }: { localePrefix: string }) {
  useEffect(() => {
    const scope = (document as { modelContext?: ModelContext }).modelContext
      ?? (navigator as { modelContext?: ModelContext }).modelContext
    if (!scope) return
    const abort = new AbortController()
    const { signal } = abort

    scope.registerTool({
      name: 'navigate',
      description: 'Open a section of the FEKRA website: home, services, careers (open jobs), blog, contact (contact form) or meeting (book a 30-minute call).',
      inputSchema: { type: 'object', properties: { page: { type: 'string', enum: Object.keys(PAGES) } }, required: ['page'] },
      execute: async ({ page }) => {
        window.location.assign(`${localePrefix}${PAGES[page as keyof typeof PAGES] ?? ''}` || '/')
        return { ok: true }
      },
    }, { signal }).catch(() => {})

    scope.registerTool({
      name: 'read_page',
      description: 'Read a FEKRA page as markdown, e.g. "/services" or "/careers". Defaults to the current page.',
      inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Site path starting with /' } } },
      execute: async ({ path }) => {
        const url = new URL(path || window.location.pathname, window.location.origin)
        if (url.origin !== window.location.origin) throw new Error('Only fekra-egy.com pages can be read')
        const res = await fetch(url, { headers: { accept: 'text/markdown' } })
        return await res.text()
      },
    }, { signal }).catch(() => {})

    return () => abort.abort()
  }, [localePrefix])

  return null
}
