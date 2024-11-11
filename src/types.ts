export type Page = {
  TITLE: string
  DESCRIPTION: string
}

export interface Site extends Page {
  AUTHOR: string
}

export type Links = {
  TEXT: string
  HREF: string
}[]

export type Socials = {
  NAME: string
  ICON: string
  TEXT: string
  HREF: string
}[]


// src/types.ts
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export {};
