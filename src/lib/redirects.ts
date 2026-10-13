import redirectMap from '../../redirects.json'

const FROM = new Set(redirectMap.map((r) => r.from))

/** A path next.config 301s away. Never list it: sitemaps and hubs must link the destination. */
export const redirectsAway = (path: string) => FROM.has(path)
