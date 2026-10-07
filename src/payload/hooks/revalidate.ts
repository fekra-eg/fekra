import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { LOCALES } from '@/i18n/routing'
import { documentHref, type LinkableCollection } from '@/lib/urls'
import { clearCmsMemo } from '@/lib/cms-cache'

type MaybeDoc = { _status?: string; slug?: string } | undefined

/**
 * Does this version of the document affect what the public can see?
 *
 * Collections without drafts have no `_status`, so they always count. For
 * draft-enabled collections only published versions matter — which is also what
 * keeps autosave out of here: the admin creates an autosave draft *while it is
 * rendering* the create screen, and calling revalidatePath during a render
 * throws and blanks the page.
 */
const affectsPublic = (doc: MaybeDoc): boolean =>
  Boolean(doc) && (doc!._status === undefined || doc!._status === 'published')

/**
 * Revalidation must never be able to break the CMS. A purge that fails is a
 * stale page for a few minutes; an exception here is an editor staring at a
 * blank screen.
 */
const purge = (paths: string[], req: { payload?: { logger?: { warn: (msg: string) => void } } }) => {
  clearCmsMemo()
  try {
    revalidateTag('cms-public', { expire: 0 })
    for (const path of paths) revalidatePath(path, 'page')
  } catch (error) {
    req.payload?.logger?.warn(`revalidate skipped: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const localePaths = (collection: LinkableCollection, slugs: Iterable<string>, listPath?: string): string[] => {
  const paths: string[] = []
  for (const slug of slugs) {
    for (const locale of LOCALES) paths.push(documentHref(collection, slug, locale))
  }
  if (listPath) {
    for (const locale of LOCALES) paths.push(`${locale === 'en' ? '' : `/${locale}`}${listPath}`)
  }
  // Keep sitemap.xml in step with what is actually published (18.5).
  paths.push('/sitemap.xml')
  return paths
}

/**
 * Pages are statically rendered and revalidated on publish (17.4). Every locale
 * of the affected path is purged, plus the listing that contains it — otherwise
 * an editor publishes and the index still shows yesterday's cards.
 */
export const revalidateDocument =
  (collection: LinkableCollection, listPath?: string): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req }) => {
    if (req.context?.disableRevalidate) return doc

    // Draft -> draft changes nothing public. Publishing and unpublishing both do.
    if (!affectsPublic(doc) && !affectsPublic(previousDoc)) return doc

    const slugs = new Set<string>([doc?.slug, previousDoc?.slug].filter(Boolean) as string[])
    purge(localePaths(collection, slugs, listPath), req)
    return doc
  }

export const revalidateOnDelete =
  (collection: LinkableCollection, listPath?: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    if (req.context?.disableRevalidate) return doc
    purge(localePaths(collection, doc?.slug ? [doc.slug] : [], listPath), req)
    return doc
  }

/** Header/Footer/Settings appear on every page — purge the whole tree. */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  clearCmsMemo()
  try {
    revalidateTag('cms-public', { expire: 0 })
    revalidatePath('/', 'layout')
  } catch (error) {
    req.payload?.logger?.warn(`revalidate skipped: ${error instanceof Error ? error.message : String(error)}`)
  }
  return doc
}

/** Populated names, category labels and media can affect any cached document. */
export const revalidateRelatedDocument: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) purge([], req)
  return doc
}

export const revalidateRelatedDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) purge([], req)
  return doc
}
