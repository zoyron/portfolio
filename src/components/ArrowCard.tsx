import { formatDate } from "@lib/utils"
import type { CollectionEntry } from "astro:content"

type Props = {
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">
  pill?: boolean
}

export default function ArrowCard({entry, pill}: Props) {
    return (
      <a 
        href={`/${entry.collection}/${entry.slug}`} 
        class="group relative flex flex-col justify-between h-full p-6 border border-card-border bg-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-card-border/0 to-card-border/0 group-hover:from-card-border/40 group-hover:to-card-border/20 transition-colors duration-500 z-0"></div>
        <div class="absolute inset-0 border-2 border-transparent group-hover:border-foreground/10 rounded-2xl transition-colors duration-500 z-0"></div>
        
        <div class="relative z-10 w-full mb-6">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div class="text-xs font-mono text-subtle/80 uppercase tracking-wider">
              {formatDate(entry.data.date)}
            </div>
            {pill &&
              <div class="text-[10px] sm:text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-foreground/10 text-foreground border border-foreground/20">
                {entry.collection === "blog" ? "post" : "project"}
              </div>
            }
          </div>
          
          <h3 class="font-display text-xl font-bold text-foreground transition-colors duration-300 mb-3">
            {entry.data.title}
          </h3>

          <p class="text-sm text-subtle line-clamp-3 leading-relaxed">
            {entry.data.summary}
          </p>
        </div>
        
        <div class="relative z-10 flex items-end justify-between w-full mt-auto pt-4 border-t border-card-border/50">
          <ul class="flex flex-wrap gap-2">
            {entry.data.tags.map((tag: string) => (
              <li class="text-[10px] uppercase font-medium tracking-wide py-1 px-2 rounded bg-card-border/50 text-foreground/70 group-hover:bg-foreground/10 group-hover:text-foreground transition-colors duration-300">
                {tag}
              </li>
            ))}
          </ul>
          
          <div class="flex-shrink-0 ml-4 p-2 rounded-full bg-background group-hover:bg-foreground group-hover:text-background text-subtle transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" class="stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" class="scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
              <polyline points="12 5 19 12 12 19" class="-translate-x-2 group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            </svg>
          </div>
        </div>
      </a>
   )
}