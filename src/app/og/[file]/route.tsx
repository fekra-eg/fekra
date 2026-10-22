import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

/**
 * Per-template share cards, 1200×630 PNG (T-18). Static: rendered once at
 * build. The `.png` suffix keeps the URL out of the locale proxy matcher.
 */
const TEMPLATES = {
  'services.png': { eyebrow: 'Services', title: 'Hire vetted developers and dedicated engineering teams' },
  'careers.png': { eyebrow: 'Careers', title: 'Build your engineering career with Fekra Tech' },
  'blog.png': { eyebrow: 'Blog', title: 'Insights on software outsourcing and engineering teams' },
} as const

type File = keyof typeof TEMPLATES

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(TEMPLATES).map((file) => ({ file }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const copy = TEMPLATES[file as File]
  if (!copy) return new Response('Not found', { status: 404 })
  const logo = `data:image/png;base64,${(await readFile(path.join(process.cwd(), 'public/icon-512.png'))).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(118deg, #eefcf3 0%, #dcf0f7 100%)',
          color: '#273969',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only */}
          <img src={logo} width={88} height={88} alt="" />
          <span style={{ fontSize: 40, fontWeight: 700 }}>Fekra Tech</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#146676', textTransform: 'uppercase', letterSpacing: 4 }}>{copy.eyebrow}</span>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{copy.title}</span>
        </div>
        <span style={{ fontSize: 28, color: '#146676' }}>www.fekra-egy.com</span>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
