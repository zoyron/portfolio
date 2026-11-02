import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { DEFAULT_OG_SLUG, OG_IMAGE_TYPE, OG_TAGLINE, hasOwnOgImage, ogImageSlug } from "@lib/og"
import { renderDefaultImage, renderPostImage } from "@lib/og-image"

// The social preview images, drawn once at build time: /og/default.png for most pages,
// and /og/<collection>/<slug>.png for every post and project with content

export const getStaticPaths = (async () => {
  const entries = [...(await getCollection("blog")), ...(await getCollection("projects"))].filter(hasOwnOgImage)

  return [
    { params: { slug: DEFAULT_OG_SLUG }, props: { title: null } },
    ...entries.map((entry) => ({ params: { slug: ogImageSlug(entry) }, props: { title: entry.data.title } })),
  ]
}) satisfies GetStaticPaths

type Props = InferGetStaticPropsType<typeof getStaticPaths>

// "sarlloc.com", from the site URL in astro.config.mjs
const domain = new URL(import.meta.env.SITE).hostname.replace(/^www\./, "")

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = props.title
    ? await renderPostImage(props.title, SITE.AUTHOR, domain)
    : await renderDefaultImage(SITE.AUTHOR, OG_TAGLINE, domain)

  return new Response(png, { headers: { "Content-Type": OG_IMAGE_TYPE } })
}
