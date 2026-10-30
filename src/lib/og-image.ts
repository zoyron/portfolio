import { readFileSync } from "node:fs"
import { join } from "node:path"
import satori, { type Font } from "satori"
import sharp from "sharp"
import { OG_IMAGE_HEIGHT as HEIGHT, OG_IMAGE_WIDTH as WIDTH } from "./og"

// Draws the social preview cards at build time: satori lays each card out and turns its text into
// SVG paths, and sharp (already used for Astro's images) rasterises that SVG to a PNG.

// The light palette from src/styles/global.css
const PAPER = "#F4ECD8"
const INK = "#2B2117"
const SUBTLE = "#5C4D3C"
const ACCENT = "#9C5A34"

// The same margin on every side, measured to the ink: the top of the first line's capitals,
// the left edge of its first letter, and the baseline of the last line
const MARGIN = 88
const CONTENT_WIDTH = WIDTH - 2 * MARGIN

// Vertical metrics in ems, from the fonts' hhea and OS/2 tables
type Metrics = { ascent: number; descent: number; capHeight: number }
const SPACE_GROTESK: Metrics = { ascent: 0.984, descent: 0.292, capHeight: 0.7 }
const ATKINSON: Metrics = { ascent: 0.796, descent: 0.251, capHeight: 0.668 }

// Satori centres the ascender-to-descender box in each line box. These are the gaps between the top of
// the line box and the top of the capitals, and between the baseline and the bottom of the line box.
const halfLeading = (font: Metrics, lineHeight: number) => (lineHeight - font.ascent - font.descent) / 2
const capInset = (font: Metrics, fontSize: number, lineHeight: number) =>
  (halfLeading(font, lineHeight) + font.ascent - font.capHeight) * fontSize
const baselineInset = (font: Metrics, fontSize: number, lineHeight: number) =>
  (halfLeading(font, lineHeight) + font.descent) * fontSize

// Large letters sit a little in from their box; pull them back so stems line up with the small text
const SIDE_BEARING = 0.04

// Satori reads static TTF, OTF and WOFF files, not the site's woff2 variable font.
// Astro builds run from the project root, which is where these paths are resolved.
function readFont(path: string) {
  return readFileSync(join(process.cwd(), path))
}

let fonts: Font[] | undefined

function loadFonts(): Font[] {
  const spaceGrotesk = "node_modules/@fontsource/space-grotesk/files/space-grotesk"
  fonts ??= [
    { name: "Space Grotesk", weight: 700, style: "normal", data: readFont(`${spaceGrotesk}-latin-700-normal.woff`) },
    { name: "Space Grotesk", weight: 700, style: "normal", data: readFont(`${spaceGrotesk}-latin-ext-700-normal.woff`) },
    { name: "Space Grotesk", weight: 400, style: "normal", data: readFont(`${spaceGrotesk}-latin-400-normal.woff`) },
    { name: "Space Grotesk", weight: 400, style: "normal", data: readFont(`${spaceGrotesk}-latin-ext-400-normal.woff`) },
    { name: "Atkinson", weight: 400, style: "normal", data: readFont("public/fonts/atkinson-regular.woff") },
  ]
  return fonts
}

type Style = Record<string, string | number>
type Child = Node | string
type Node = { type: "div"; props: { style: Style; children: Child | Child[] } }

// A satori element: every box is a flex container, as satori requires
function box(style: Style, ...children: Child[]): Node {
  return { type: "div", props: { style: { display: "flex", ...style }, children } }
}

// The paper, with the large text pinned to the top margin and the signature to the bottom one
function card(top: Node, bottom: Node) {
  return box(
    {
      width: WIDTH,
      height: HEIGHT,
      padding: MARGIN,
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: PAPER,
    },
    top,
    bottom,
  )
}

// Space Grotesk bold with the site's tight heading tracking
const displayFont = (fontSize: number): Style => ({
  fontFamily: "Space Grotesk",
  fontWeight: 700,
  fontSize,
  letterSpacing: fontSize * -0.025,
})

// Large display text with its first capitals on the margins
function display(text: string, fontSize: number, lineHeight: number, style: Style = {}) {
  return box(
    {
      ...displayFont(fontSize),
      lineHeight,
      color: INK,
      marginTop: -capInset(SPACE_GROTESK, fontSize, lineHeight),
      marginLeft: -SIDE_BEARING * fontSize,
      ...style,
    },
    text,
  )
}

// The small text under the rule: the name in the header's face, the address in the body face
const signatureName = (name: string) =>
  box({ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 30, lineHeight: 1, color: INK }, name)

const SITE_SIZE = 28

const signatureSite = (site: string) =>
  box({ fontFamily: "Atkinson", fontSize: SITE_SIZE, lineHeight: 1, color: SUBTLE }, site)

// A thin terracotta rule over the small text. The address ends every signature and, aligned on the
// shared baseline, its line box reaches lowest, so its baseline inset puts the baseline on the margin.
function signature(...children: Node[]) {
  return box(
    { flexDirection: "column", gap: 28, marginBottom: -baselineInset(ATKINSON, SITE_SIZE, 1) },
    box({ width: 56, height: 3, backgroundColor: ACCENT }),
    box({ alignItems: "baseline", gap: 18 }, ...children),
  )
}

// Titles are set as large as they fit: up to three lines, then four at the smallest size
const TITLE_FITS = [
  { fontSize: 84, maxLines: 3 },
  { fontSize: 76, maxLines: 3 },
  { fontSize: 68, maxLines: 3 },
  { fontSize: 60, maxLines: 4 },
]
const TITLE_LINE_HEIGHT = 1.1

// The type area, plus the bearing the title is pulled back by on the left
const titleWidth = (fontSize: number) => CONTENT_WIDTH + SIDE_BEARING * fontSize

function title(text: string, fontSize: number, breakWords: boolean) {
  return display(text, fontSize, TITLE_LINE_HEIGHT, {
    width: titleWidth(fontSize),
    // Balanced lines, unless a word is too long for a line and has to break rather than run off the card
    ...(breakWords ? { wordBreak: "break-word" } : { textWrap: "balance" }),
  })
}

async function titleLines(text: string, fontSize: number, breakWords: boolean) {
  // Without a height, satori sizes the SVG to the laid-out text, so its height counts the lines
  const svg = await satori(box({}, title(text, fontSize, breakWords)), { width: WIDTH, fonts: loadFonts() })
  const height = Number(svg.match(/height="([\d.]+)"/)?.[1]) + capInset(SPACE_GROTESK, fontSize, TITLE_LINE_HEIGHT)
  return Math.round(height / (fontSize * TITLE_LINE_HEIGHT))
}

async function widestWord(text: string, fontSize: number) {
  let widest = 0
  for (const word of text.split(/\s+/)) {
    // Without a width, satori sizes the SVG to the word's own width
    const svg = await satori(box(displayFont(fontSize), word), { height: fontSize * 2, fonts: loadFonts() })
    widest = Math.max(widest, Number(svg.match(/width="([\d.]+)"/)?.[1]))
  }
  return widest
}

async function fitTitle(text: string) {
  for (const { fontSize, maxLines } of TITLE_FITS) {
    const fits =
      (await widestWord(text, fontSize)) <= titleWidth(fontSize) && (await titleLines(text, fontSize, false)) <= maxLines
    if (fits) return { text, fontSize, breakWords: false }
  }

  // Too long for any fit: at the smallest size, break words that are wider than a line,
  // and shorten the title word by word until it fits
  const { fontSize, maxLines } = TITLE_FITS[TITLE_FITS.length - 1]
  const breakWords = (await widestWord(text, fontSize)) > titleWidth(fontSize)
  const words = text.split(/\s+/)
  let candidate = text
  while (words.length > 1 && (await titleLines(candidate, fontSize, breakWords)) > maxLines) {
    words.pop()
    candidate = `${words.join(" ").replace(/[\s,.:;!?–—-]+$/, "")}…`
  }
  return { text: candidate, fontSize, breakWords }
}

async function toPng(node: Node) {
  const svg = await satori(node, { width: WIDTH, height: HEIGHT, fonts: loadFonts() })
  // The card is opaque, so the alpha channel only adds weight
  return sharp(Buffer.from(svg)).removeAlpha().png({ compressionLevel: 9 }).toBuffer()
}

// A post or project: its title large, signed with the name and the address
export async function renderPostImage(postTitle: string, author: string, site: string) {
  const { text, fontSize, breakWords } = await fitTitle(postTitle)
  return toPng(card(title(text, fontSize, breakWords), signature(signatureName(author), signatureSite(site))))
}

// Every other page: the name large with the line from the home page beneath it, signed with the address
export async function renderDefaultImage(author: string, tagline: string, site: string) {
  return toPng(
    card(
      box(
        { flexDirection: "column", gap: 22 },
        display(author, 120, 1),
        box({ fontFamily: "Space Grotesk", fontWeight: 400, fontSize: 40, lineHeight: 1.3, color: SUBTLE }, tagline),
      ),
      signature(signatureSite(site)),
    ),
  )
}
