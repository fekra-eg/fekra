'use client'

import { useEffect, useRef } from 'react'

/** Same renderer for the editor preview and published article. */
export function HtmlArticle({ document, title }: { document: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const element = frame.current
    if (!element) return
    let observer: ResizeObserver | undefined
    // The frame is as tall as its content, so in-article #anchors must scroll the host page.
    const scrollToAnchor = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]')
      const target = link && element.contentDocument?.getElementById(decodeURIComponent(link.getAttribute('href')!.slice(1)))
      if (!target) return
      event.preventDefault()
      window.scrollTo({ top: element.getBoundingClientRect().top + target.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
    }
    const observe = () => {
      observer?.disconnect()
      const body = element.contentDocument?.body
      if (!body) return
      body.ownerDocument.removeEventListener('click', scrollToAnchor)
      body.ownerDocument.addEventListener('click', scrollToAnchor)
      const resize = () => {
        const styles = element.contentWindow?.getComputedStyle(body)
        const margins = parseFloat(styles?.marginTop || '0') + parseFloat(styles?.marginBottom || '0')
        const height = Math.ceil(Math.max(body.scrollHeight, body.getBoundingClientRect().height) + margins)
        element.style.height = `${Math.max(200, height)}px`
      }
      observer = new ResizeObserver(resize)
      observer.observe(body)
      resize()
    }
    element.addEventListener('load', observe)
    observe()
    return () => {
      element.removeEventListener('load', observe)
      element.contentDocument?.removeEventListener('click', scrollToAnchor)
      observer?.disconnect()
    }
  }, [document])

  return <iframe ref={frame} title={title} srcDoc={document} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', height: 400, border: 0, background: 'white' }} />
}
