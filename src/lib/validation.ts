import { z } from 'zod'

/**
 * One schema per form, used by the client for instant feedback AND by the route
 * handler as the authoritative check (21.2). The client copy is a convenience;
 * the server never trusts it.
 */

/** 11.2 — accepts international formats instead of forcing a local shape. */
/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits, as typed on an Arabic keyboard, to ASCII. */
const asciiDigits = (value: string) =>
  value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) & 0xf))

const phone = z
  .string()
  .trim()
  .overwrite(asciiDigits)
  .regex(/^\+?[\d\s().-]{7,20}$/, 'phone')
  .refine((value) => value.replace(/\D/g, '').length >= 7, 'phone')

/**
 * Tracking metadata the visitor never sees. Clipped, never rejected: a long
 * referrer (percent-encoded Arabic slugs triple in length) used to fail
 * validation on a field with no visible error, so the form silently stalled.
 */
const clip = (max: number) => z.string().transform((value) => value.slice(0, max)).optional()
const attribution = z.object({
  locale: clip(5),
  sourcePath: clip(512),
  utmSource: clip(128),
  utmMedium: clip(128),
  utmCampaign: clip(128),
  referrer: clip(512),
})

/**
 * Bot traps: `website` is a hidden field a human never fills, `startedAt` is the
 * form render time — a submission faster than 2s is scripted (11.3 / 21.3).
 * Both are cheap, invisible and add no friction for real prospects.
 */
const botTraps = z.object({
  // Deliberately permissive: a filled honeypot must PARSE so the route can
  // return a silent 200. Failing validation here would tell the bot it was
  // caught (and would surface as a form error for the rare autofill victim).
  website: z.string().optional(),
  startedAt: z.coerce.number().optional(),
})

export const contactSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    phone: phone.optional().or(z.literal('')),
    company: z.string().trim().max(160).optional(),
    country: z.string().trim().max(120).optional(),
    roleNeeded: z.string().trim().max(200).optional(),
    teamSize: z.string().trim().max(40).optional(),
    subject: z.string().trim().min(2).max(200),
    message: z.string().trim().min(10).max(5000),
    consent: z.literal(true),
  })
  .merge(botTraps)
  .merge(attribution)

export const newsletterSchema = z
  .object({ email: z.email().max(254), path: z.string().max(512).optional(), locale: z.string().max(5).optional() })
  .merge(botTraps)

export const consultationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone,
  model: z.enum(['Full Time', 'Part Time', 'Hourly Time']),
  consent: z.literal(true),
})

export const applicationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    phone: phone,
    linkedin: z.url().max(512).optional().or(z.literal('')),
    coverNote: z.string().trim().max(3000).optional(),
    jobId: z.union([z.string(), z.number()]),
    consent: z.literal(true),
  })
  .merge(botTraps)
  .merge(attribution)

export type ContactInput = z.infer<typeof contactSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>

export const CV = {
  maxBytes: 5 * 1024 * 1024,
  // 21.4 — allow-list by MIME *and* extension; anything else is rejected.
  mimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  extensions: ['.pdf', '.doc', '.docx'],
}

export function validateCv(file: File): 'fileType' | 'fileSize' | null {
  if (file.size > CV.maxBytes) return 'fileSize'
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!CV.mimeTypes.includes(file.type) || !CV.extensions.includes(ext)) return 'fileType'
  return null
}

/** Minimum seconds between form render and submit for a human. */
export const MIN_FILL_SECONDS = 2
