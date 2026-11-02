import type { CollectionEntry } from "astro:content"
import { SITE } from "@consts"
import { hasBody } from "@lib/utils"

// Social preview images: what each page shares and where its image is published.
// The images themselves are drawn at build time by src/pages/og/[...slug].png.ts.

export type OgImage = {
  src: string
  alt: string
}

type Entry = CollectionEntry<"blog"> | CollectionEntry<"projects">

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const OG_IMAGE_TYPE = "image/png"

// The line under the name on the home page, repeated under it on the site's own image
export const OG_TAGLINE = "Creative engineer and generative artist"

export const DEFAULT_OG_SLUG = "default"

export const DEFAULT_OG_IMAGE: OgImage = {
  src: `/og/${DEFAULT_OG_SLUG}.png`,
  alt: `${SITE.AUTHOR}, ${OG_TAGLINE.toLowerCase()}`,
}

// Placeholder entries have no page content, so they share the site image instead of getting their own
export function hasOwnOgImage(entry: Entry) {
  return hasBody(entry)
}

// The path of an entry's image under /og/, without the extension: "blog/p5js/redrose"
export function ogImageSlug(entry: Entry) {
  return `${entry.collection}/${entry.slug}`
}

export function ogImageFor(entry: Entry): OgImage {
  if (!hasOwnOgImage(entry)) return DEFAULT_OG_IMAGE
  return {
    src: `/og/${ogImageSlug(entry)}.png`,
    alt: `${entry.data.title}, by ${SITE.AUTHOR}`,
  }
}
