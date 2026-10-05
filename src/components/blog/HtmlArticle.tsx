'use client'

import { useEffect, useRef } from 'react'

/** Same renderer for the editor preview and published article. */
export function HtmlArticle({ document, title }: { document: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const element = frame.current
    if (!element) return
    let observer: ResizeObserver | undefined
    const observe = () => {
      observer?.disconnect()
      const body = element.contentDocument?.body
      if (!body) return
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
      observer?.disconnect()
    }
  }, [document])

  return <iframe ref={frame} title={title} srcDoc={document} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', height: 400, border: 0, background: 'white' }} />
}
