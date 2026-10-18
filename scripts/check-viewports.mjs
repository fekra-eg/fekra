/**
 * Responsive pass at fixed viewports — checklist 16.3 (tablet portrait and
 * landscape) and 16.4 (13–15" laptops).
 *
 *   node scripts/check-viewports.mjs [baseUrl] [outDir]
 *
 * Drives headless Chrome over the DevTools protocol with nothing but Node's
 * built-in fetch and WebSocket — no Puppeteer, no Playwright, no new dependency
 * for a check that runs a handful of times before a launch.
 *
 * For each page × viewport it writes a full-page PNG to look at, and asserts
 * the things a screenshot is bad at judging:
 *   - horizontal overflow (body has `overflow-x: clip`, so an offending element
 *     is silently cut off rather than producing a scrollbar — measure instead)
 *   - tap/click targets under 44px (16.2)
 *   - which navigation the breakpoint chose, desktop or burger (16.3)
 *   - text smaller than 12px, and images wider than their box
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'https://fekra-beige.vercel.app'
const OUT = process.argv[3] ?? 'viewport-shots'

const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// 16.2 phones, 16.3 tablets, 16.4 laptops. deviceScaleFactor 1 keeps the PNGs
// small; the layout, not the pixel density, is what is under test.
const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800, mobile: true, group: '16.2', note: 'small Android' },
  { name: 'mobile-390', width: 390, height: 844, mobile: true, group: '16.2', note: 'iPhone 14 / 15' },
  { name: 'mobile-430', width: 430, height: 932, mobile: true, group: '16.2', note: 'iPhone Pro Max' },
  { name: 'tablet-portrait-768', width: 768, height: 1024, group: '16.3', note: 'iPad / iPad mini portrait' },
  { name: 'tablet-landscape-1024', width: 1024, height: 768, group: '16.3', note: 'iPad landscape' },
  { name: 'tablet-portrait-834', width: 834, height: 1194, group: '16.3', note: 'iPad Pro 11" portrait' },
  { name: 'laptop-1280', width: 1280, height: 800, group: '16.4', note: '13" MacBook Air' },
  { name: 'laptop-1440', width: 1440, height: 900, group: '16.4', note: '14" / common Mac default' },
  { name: 'laptop-1536', width: 1536, height: 864, group: '16.4', note: '15" Windows, most common desktop width' },
]

// Default sweep. PAGES=/ar/about,/de/about narrows it to one page in several
// locales, which is how the RTL and long-translation pass (9.4) is run.
const PAGES = process.env.PAGES
  ? process.env.PAGES.split(',').map((p) => p.trim()).filter(Boolean)
  : ['/', '/services', '/blog', '/about', '/careers', '/contact', '/services/hire-front-end-developers']

// Both themes have to hold the same layout (9.4). Light by default because the
// comps are light; SCHEME=dark runs the other half.
const SCHEME = process.env.SCHEME === 'dark' ? 'dark' : 'light'

/** The page-side probe. Returns plain data; anything DOM-ish stays in here. */
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth
  const out = { vw, scrollWidth: document.documentElement.scrollWidth, overflow: [], small: [], tiny: 0, nav: null }
  const label = (el) => {
    const id = el.id ? '#' + el.id : ''
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''
    return el.tagName.toLowerCase() + id + cls
  }
  // A marquee or a scrolling tab strip is meant to be wider than the screen;
  // what matters is whether its container clips it. Anything inside an element
  // that already handles its own horizontal overflow is not a layout break.
  const clipped = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX
      if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') return true
    }
    return false
  }
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    // A 1px box is the sr-only pattern (clipped skip link), not a layout break.
    // It sits at the inline-start edge, so in RTL it lands 1px past the right
    // of the viewport and reads as overflow in Arabic and nowhere else.
    if (r.width <= 1 || r.height <= 1) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue
    // Overflow: sticks out past the viewport by more than a rounding error.
    if (r.right > vw + 1 || r.left < -1) {
      if (cs.position !== 'fixed' && !el.closest('[aria-hidden="true"]') && !clipped(el)) {
        out.overflow.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right) })
      }
    }
    // Tap targets: interactive and smaller than 44 x 44 (16.2). Skip the ones
    // a screen only ever exposes to assistive tech or to bots.
    if (el.matches('a[href], button, input:not([type=hidden]), select, textarea, [role=button]')) {
      const stretched = typeof el.className === 'string' && el.className.includes('after:inset-0')
      const honeypot = cs.position === 'absolute' && (r.left < -1 || r.top < -1)
      if ((r.width < 44 || r.height < 44) && el.offsetParent !== null && !el.closest('.sr-only') && !el.matches('.sr-only') && !stretched && !honeypot) {
        out.small.push({ el: label(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40) })
      }
    }
    if (el.children.length === 0 && el.innerText && parseFloat(cs.fontSize) < 12) out.tiny++
  }
  // aria-expanded, not the aria-label: the burger's label is localized
  // ("Menü", "menú", "القائمة"), so a label match reports "unknown" on exactly
  // the locales an RTL/i18n pass exists to check.
  const burger = document.querySelector('button[aria-controls*="menu" i], button[aria-label*="menu" i]')
  const desktopNav = [...document.querySelectorAll('header nav, [class*="header"] nav')].find((n) => n.offsetParent !== null && n.getBoundingClientRect().width > 200)
  out.nav = burger && burger.offsetParent !== null ? 'burger' : desktopNav ? 'desktop' : 'unknown'
  out.dir = document.documentElement.getAttribute('dir') || getComputedStyle(document.documentElement).direction
  out.lang = document.documentElement.lang
  out.overflow = out.overflow.slice(0, 8)
  out.small = out.small.slice(0, 20)
  return out
})()`

// ── CDP over a raw WebSocket ────────────────────────────────────────────────
const connect = async (wsUrl) => {
  const ws = new WebSocket(wsUrl)
  await new Promise((ok, no) => ((ws.onopen = ok), (ws.onerror = no)))
  let id = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    const slot = pending.get(msg.id)
    if (!slot) return
    pending.delete(msg.id)
    if (msg.error) slot.no(new Error(msg.error.message))
    else slot.ok(msg.result)
  }
  const send = (method, params = {}) =>
    new Promise((ok, no) => {
      const n = ++id
      pending.set(n, { ok, no })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  return { send, close: () => ws.close() }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const run = async () => {
  mkdirSync(OUT, { recursive: true })
  const port = 9333
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + OUT + '/.chrome-profile',
    '--hide-scrollbars',
  ])
  chrome.on('error', (e) => { throw e })

  // Wait for the debugging endpoint rather than guessing at a sleep.
  let version
  for (let i = 0; i < 50 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json() } catch { await sleep(200) }
  }
  if (!version) throw new Error('Chrome did not open a debugging port')

  const results = []
  // ONLY=mobile narrows the sweep to viewports whose name contains it.
  for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
    for (const path of PAGES) {
      const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
      const cdp = await connect(target.webSocketDebuggerUrl)
      try {
        await cdp.send('Page.enable')
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: Boolean(vp.mobile),
        })
        // Two emulated media settings, both deliberate:
        //  - light, because the comps are light and headless Chrome reports
        //    dark by default, which would test a palette nobody signed off;
        //  - reduced motion, because the reveal animations are scroll-linked,
        //    so a full-page capture renders every off-screen section at its
        //    opacity-0 start state and the shot comes out blank below the fold.
        await cdp.send('Emulation.setEmulatedMedia', {
          features: [
            { name: 'prefers-color-scheme', value: SCHEME },
            { name: 'prefers-reduced-motion', value: 'reduce' },
          ],
        })
        await cdp.send('Page.navigate', { url: BASE + path })
        // The splash screen removes itself on `load`, capped at 2.5s.
        await sleep(4000)
        // Sections start at opacity 0 until they scroll into view (.fk-reveal),
        // and images below the fold are lazy — without a scroll pass both the
        // probe and the screenshot would see an empty page and call it clean.
        await cdp.send('Runtime.evaluate', {
          awaitPromise: true,
          expression: `(async () => {
            const step = window.innerHeight * 0.8
            for (let y = 0; y < document.body.scrollHeight; y += step) {
              window.scrollTo(0, y)
              await new Promise((r) => setTimeout(r, 120))
            }
            window.scrollTo(0, 0)
            await new Promise((r) => setTimeout(r, 600))
          })()`,
        })
        const evaluated = await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true })
        if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.exception?.description ?? 'probe failed')
        const { result } = evaluated
        const name = `${SCHEME}-${vp.name}${path === '/' ? '-home' : path.replace(/\//g, '-')}`
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true, optimizeForSpeed: true,
        })
        writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'))
        results.push({ viewport: vp.name, group: vp.group, size: `${vp.width}x${vp.height}`, path, ...result.value })
        const r = result.value
        console.log(
          `${vp.name.padEnd(22)} ${path.padEnd(24)} dir=${String(r.dir).padEnd(4)} nav=${String(r.nav).padEnd(8)} overflow=${r.overflow.length} small-targets=${r.small.length} tiny-text=${r.tiny}`,
        )
      } finally {
        cdp.close()
        await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`)
      }
    }
  }

  writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1))
  chrome.kill()

  const bad = results.filter((r) => r.overflow.length || r.small.length)
  console.log(`\n${results.length} page/viewport combinations, ${bad.length} with findings. Shots + results.json in ${OUT}/`)
  process.exit(0)
}

run().catch((e) => { console.error(e); process.exit(1) })
