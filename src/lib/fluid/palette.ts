import { Color, SRGBColorSpace } from "three"

/** sRGB components in 0..1: the canvas composites straight into the page, so no linear conversion */
export type Rgb = [number, number, number]

export interface FluidPalette {
  /** Colour of a faint wash */
  low: Rgb
  /** Colour of the densest ink */
  high: Rgb
  /** Opacity of the densest ink, capped so the hero text stays readable over it */
  maxAlpha: number
}

const parser = new Color()

function token(style: CSSStyleDeclaration, name: string): Rgb {
  parser.setStyle(style.getPropertyValue(name).trim())
  const { r, g, b } = parser.getRGB({ r: 0, g: 0, b: 0 }, SRGBColorSpace)
  return [r, g, b]
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/**
 * Reads the ink colours from the site's design tokens on <html>.
 * Light: a pale wash of the accent deepening to the full accent, like sepia ink on paper.
 * Dark: the accent glowing in the dark, its densest core warming toward the cream foreground.
 */
export function readPalette(root: HTMLElement): FluidPalette {
  const style = getComputedStyle(root)
  const accent = token(style, "--accent")

  if (root.classList.contains("dark")) {
    return { low: accent, high: mix(accent, token(style, "--foreground"), 0.2), maxAlpha: 0.7 }
  }
  return { low: mix(accent, token(style, "--background"), 0.45), high: accent, maxAlpha: 0.62 }
}
