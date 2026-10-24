import { formatDate } from "@lib/utils"
import type { CollectionEntry } from "astro:content"

type Props = {
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">
  showKind?: boolean
}

// One entry in a reading list. Render inside <ul class="divide-y divide-card-border">
// so the list owns the hairlines between rows.
export default function PostRow({ entry, showKind }: Props) {
  return (
    <a
      href={`/${entry.collection}/${entry.slug}`}
      class="group grid grid-cols-1 md:grid-cols-[9rem_1fr] gap-y-1.5 md:gap-x-6 py-6 rounded-xl"
    >
      <div class="md:pt-2.5 flex md:flex-col gap-x-2 gap-y-0.5 text-sm text-subtle tabular-nums">
        <time datetime={entry.data.date.toISOString()}>{formatDate(entry.data.date)}</time>
        {showKind && entry.collection === "projects" && (
          <>
            <span class="md:hidden" aria-hidden="true">·</span>
            <span>Project</span>
          </>
        )}
      </div>

      <div class="min-w-0">
        <h3 class="font-display text-xl md:text-2xl font-bold text-foreground leading-snug transition-colors duration-200 group-hover:text-accent group-focus-visible:text-accent">
          {entry.data.title}
        </h3>
        <p class="mt-2 max-w-prose text-subtle leading-relaxed line-clamp-2">
          {entry.data.summary}
        </p>
      </div>
    </a>
  )
}
