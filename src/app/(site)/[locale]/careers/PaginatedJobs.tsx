'use client'

import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './careers.module.css'

const PER_PAGE = 5

/**
 * Every role stays in the HTML (crawlable, and the in-page anchors keep
 * working); only the visible slice changes. Five or fewer: no controls at all.
 */
export function PaginatedJobs({ items, labels }: {
  items: ReactNode[]
  labels: { nav: string; previous: string; next: string; page: string }
}) {
  const [page, setPage] = useState(0)
  const pages = Math.ceil(items.length / PER_PAGE)
  const go = (next: number) => {
    setPage(next)
    document.getElementById('open-roles')?.scrollIntoView({ block: 'start' })
  }

  return <>
    {items.map((item, index) => <div key={index} hidden={Math.floor(index / PER_PAGE) !== page}>{item}</div>)}
    {pages > 1 ? <nav className={styles.pagination} aria-label={labels.nav}>
      <button type="button" onClick={() => go(page - 1)} disabled={page === 0} aria-label={labels.previous}>
        <ChevronLeft size={18} aria-hidden className="icon-flip" />
      </button>
      {Array.from({ length: pages }, (_, index) => <button
        key={index}
        type="button"
        onClick={() => go(index)}
        aria-current={index === page ? 'page' : undefined}
        aria-label={`${labels.page} ${index + 1}`}
      >{index + 1}</button>)}
      <button type="button" onClick={() => go(page + 1)} disabled={page === pages - 1} aria-label={labels.next}>
        <ChevronRight size={18} aria-hidden className="icon-flip" />
      </button>
    </nav> : null}
  </>
}
