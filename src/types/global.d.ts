// src/global.d.ts or src/types/global.d.ts
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export {}; // Required to make this file a module
