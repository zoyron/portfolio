import type { CollectionEntry } from "astro:content"
import { createEffect, createSignal, For } from "solid-js"
import ArrowCard from "@components/ArrowCard"
import { cn } from "@lib/utils"

type Props = {
  tags: string[]
  data: CollectionEntry<"blog">[]
}

export default function Blog({ data, tags }: Props) {
  const [filter, setFilter] = createSignal(new Set<string>())
  const [posts, setPosts] = createSignal<CollectionEntry<"blog">[]>([])

  createEffect(() => {
    setPosts(data.filter((entry) => 
      Array.from(filter()).every((value) => 
        entry.data.tags.some((tag:string) => 
          tag.toLowerCase() === String(value).toLowerCase()
        )
      )
    ))
  })

  function toggleTag(tag: string) {
    setFilter((prev) => 
      new Set(prev.has(tag) 
        ? [...prev].filter((t) => t !== tag) 
        : [...prev, tag]
      )
    )
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
      <div class="md:col-span-1 border-b md:border-b-0 md:border-r border-card-border pb-6 md:pb-0 md:pr-6">
        <div class="sticky top-24">
          <div class="font-display text-sm font-semibold mb-6 text-foreground/60 tracking-wide uppercase">Filter</div>
          <ul class="flex flex-wrap md:flex-col gap-2">
            <For each={tags}>
              {(tag) => (
                <li>
                  <button onClick={() => toggleTag(tag)} class={cn(
                    "text-xs font-medium tracking-wide px-2 py-1 rounded",
                    "whitespace-nowrap overflow-hidden overflow-ellipsis",
                    "transition-all duration-200 ease-in-out",
                    filter().has(tag) 
                      ? "text-foreground bg-card-border/40" 
                      : "text-subtle/60 hover:text-subtle hover:bg-card-border/20"
                  )}>
                    {tag}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
      <div class="md:col-span-3 lg:col-span-4">
        <div class="flex flex-col">
          <div class="text-xs font-mono tracking-wider uppercase text-subtle mb-6 flex items-center gap-4">
            <span>Showing {posts().length} of {data.length} posts</span>
            <div class="h-px bg-card-border flex-1"></div>
          </div>
          <ul class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <For each={posts()}>
              {(post) => (
                <li class="h-full">
                  <ArrowCard entry={post} />
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </div>
  )
}
