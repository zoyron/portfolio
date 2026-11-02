import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { isPublished } from "@lib/utils"

type Context = {
  site: string
}

export async function GET(context: Context) {
  const posts = await getCollection("blog", isPublished)
  const projects = await getCollection("projects", isPublished)

  const items = [...posts, ...projects]

  items.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: item.data.date,
      // Slugs never include the collection, so the collection is the first path segment
      link: `/${item.collection}/${item.slug}/`,
    })),
  })
}
