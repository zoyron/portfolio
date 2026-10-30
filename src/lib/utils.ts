import type { CollectionEntry } from "astro:content"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date)
}

export function formatMonthYear(input: Date | string) {
  if (typeof input === "string") return input
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
  }).format(input)
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "")
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed()
  return `${readingTimeMinutes} min read`
}

type Post = CollectionEntry<"blog"> | CollectionEntry<"projects">

// Entries without a body are placeholders, not posts
export function hasBody(entry: Post) {
  return entry.body.trim().length > 0
}

// What the site lists and the feed announces: finished entries with something to read
export function isPublished(entry: Post) {
  return !entry.data.draft && hasBody(entry)
}
