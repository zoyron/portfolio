import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Sagar's Corner",
  DESCRIPTION: "I am Sagar. Welcome to my corner. This site will serve as a personal portfolio, and a blog as well.",
  AUTHOR: "Sagar Arora",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Blog", 
    HREF: "/blog", 
  },
  { 
    TEXT: "Projects", 
    HREF: "/projects", 
  },
  { 
    TEXT: "Work", 
    HREF: "/work", 
  },
]

// Socials
export const SOCIALS: Socials = [
  { 
    NAME: "Email",
    ICON: "email", 
    TEXT: "sgrarora2@gmail.com",
    HREF: "mailto:sgrarora2@gmail.com",
  },
  { 
    NAME: "Github",
    ICON: "github",
    TEXT: "zoyron",
    HREF: "https://github.com/zoyron"
  },
  { 
    NAME: "Twitter",
    ICON: "twitter-x",
    TEXT: "sarlloc",
    HREF: "https://twitter.com/sarlloc",
  },
]

