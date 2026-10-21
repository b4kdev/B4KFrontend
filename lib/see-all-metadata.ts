import type { Metadata } from 'next'

/** See all lists repeat their row's places: crawled for links, kept out of search results. */
export const seeAllMetadata: Metadata = { robots: { index: false, follow: true } }
