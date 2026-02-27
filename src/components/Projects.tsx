import type { CollectionEntry } from "astro:content"
import { createEffect, createSignal, For } from "solid-js"
import ArrowCard from "@components/ArrowCard"
import { cn } from "@lib/utils"

type Props = {
  tags: string[]
  data: CollectionEntry<"projects">[]
}

export default function Projects({ data, tags }: Props) {
  const [filter, setFilter] = createSignal(new Set<string>())
  const [projects, setProjects] = createSignal<CollectionEntry<"projects">[]>([])

  createEffect(() => {
    setProjects(data.filter((entry) => 
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
          <div class="font-display text-lg font-bold mb-4 text-foreground">Filter</div>
          <ul class="flex flex-wrap md:flex-col gap-2">
            <For each={tags}>
              {(tag) => (
                <li>
                  <button onClick={() => toggleTag(tag)} class={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium tracking-wide",
                    "whitespace-nowrap overflow-hidden overflow-ellipsis",
                    "flex gap-3 items-center",
                    "border transition-all duration-300 ease-in-out",
                    filter().has(tag) 
                      ? "bg-foreground border-transparent text-background" 
                      : "bg-card border-card-border/50 text-subtle hover:bg-card-border/30 hover:text-foreground"
                  )}>
                    <svg class={cn(
                      "size-4 transition-colors duration-300 ease-in-out shrink-0", 
                      filter().has(tag) ? "fill-background" : "fill-subtle/50"
                    )}>
                      <use href={`/ui.svg#square`} class={cn(!filter().has(tag) ? "block" : "hidden")} />
                      <use href={`/ui.svg#square-check`} class={cn(filter().has(tag) ? "block" : "hidden")} />
                    </svg>
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
            <span>Showing {projects().length} of {data.length} projects</span>
            <div class="h-px bg-card-border flex-1"></div>
          </div>
          <ul class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <For each={projects()}>
              {(project) => (
                <li class="h-full">
                  <ArrowCard entry={project} />
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </div>
  )
}
