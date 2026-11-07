import { newsletterAction } from '@/lib/newsletter-action'
export const runtime = 'nodejs'
export const GET = (request: Request) => newsletterAction(request, 'confirm')
export const POST = GET
