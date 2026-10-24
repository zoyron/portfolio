import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  WebGLRenderer,
  type IUniform,
} from "three"
import type { FluidPalette } from "./palette"
import quadVert from "./quad.vert?raw"
import splatGlsl from "./splat.glsl?raw"
import velocityFrag from "./velocity.frag?raw"
import dyeFrag from "./dye.frag?raw"
import displayFrag from "./display.frag?raw"
import resampleFrag from "./resample.frag?raw"

export interface FluidOptions {
  /** Touch-first device: compact grid and a single velocity substep per tick */
  touch?: boolean
}

/** Fixed simulation tick, so the pool moves the same at 60, 120 or 144 Hz */
const TICK = 1 / 60
/** Ticks one frame may catch up; a longer stall is dropped instead of replayed */
const MAX_TICKS_PER_FRAME = 3

/** Grid long side in cells; the short side follows the host's aspect so ink is never stretched */
const GRID_LONG = 320
const GRID_LONG_COMPACT = 224
const GRID_MIN = 24
/** Hosts narrower than this use the compact grid even with a mouse */
const COMPACT_WIDTH = 768
/** The display pass only upsamples the grid, so extra device pixels buy nothing */
const MAX_PIXEL_RATIO = 1.5

/** Velocity solver, retuned from the reference sketch toward stillness */
const FLOW = {
  viscosity: 0.6,
  /** Vorticity confinement strength (sketch: 0.22) */
  vorticity: 0.12,
  /** Curl clamp; the sketch tied it to the confinement strength, which starves the eddies */
  curlLimit: 1,
  /** Velocity kept per tick: a stroke's wake glides on and settles within ~2 s */
  damping: 0.99,
  /** Speed cap in cells per unit step (sketch: 10) */
  maxSpeed: 9,
  /** How far the ink travels per tick, per unit of velocity */
  advect: 0.2,
}

/** Ink fade per tick: ~1.9 s half-life plus a linear floor, so strokes linger 3-5 s then vanish */
const FADE = { decay: 0.994, fade: 0.00025 }

/** The pointer's brush */
const STROKE = {
  /** Brush radius in cells (~25 px) */
  radius: 5.5,
  /** Force per cell of pointer travel per tick */
  force: 4,
  maxForce: 30,
  /** Ink per tick at full pace; slower strokes leave less (pace^1.5) */
  ink: 0.6,
  /** Pointer travel per tick, in cells, that counts as full pace */
  fullPace: 8,
  /** Ink of a dab, the drop left where a touch lands */
  dab: 0.3,
}

/**
 * The ambient current: a hidden stirrer idling along a Lissajous path. On an irregular
 * rhythm it glides at a gentle stroke pace with ~15 % of a stroke's force, leaving a faint
 * wisp that curls and fades like a real one; between glides it barely moves.
 */
const CURRENT = {
  radius: 6.5,
  /** Force and ink per tick at the peak of a glide */
  force: 0.7,
  ink: 0.012,
  /** Path phase per second at the peak of a glide (~1.2 cells per tick), and the idle share of it */
  pace: 0.6,
  idle: 0.12,
  /** Clock at load, chosen so the first frame already holds a fresh wisp */
  start: 14,
}

/** Coverage = 1 - exp(-ink * gain) */
const INK_GAIN = 1.5
/** Seconds to cross-fade the ink colours on a theme switch */
const PALETTE_FADE = 0.5

type Uniforms = Record<string, IUniform>
type Pair = [WebGLRenderTarget, WebGLRenderTarget]

function makeTarget(width: number, height: number) {
  return new WebGLRenderTarget(width, height, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  })
}

function makePair(width: number, height: number): Pair {
  return [makeTarget(width, height), makeTarget(width, height)]
}

function makeMaterial(fragmentShader: string, uniforms: Uniforms) {
  return new ShaderMaterial({
    vertexShader: quadVert,
    fragmentShader,
    uniforms,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  })
}

/**
 * A GPU fluid on an aspect-correct grid: a still pool that the pointer stirs ink into,
 * kept faintly alive by an ambient current. The class owns no DOM listeners; its host
 * feeds it pointer samples, frame times and theme palettes.
 */
export class FluidSim {
  private readonly renderer: WebGLRenderer
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly quad: Mesh<PlaneGeometry, ShaderMaterial>
  private readonly velocityPass: ShaderMaterial
  private readonly dyePass: ShaderMaterial
  private readonly displayPass: ShaderMaterial
  private readonly resamplePass: ShaderMaterial

  private readonly grid = new Vector2()
  private velocity: Pair | null = null
  private dye: Pair | null = null

  private readonly substeps: number
  private readonly forceScale: number
  private readonly compactAlways: boolean

  private width = 0
  private height = 0
  private pixelRatio = 0
  private accumulator = 0
  private time = CURRENT.start
  /** Position of the hidden stirrer along its path */
  private phase = 0

  /** Pointer travel gathered since the last tick, in host CSS pixels */
  private readonly stroke = { active: false, x0: 0, y0: 0, x1: 0, y1: 0, strength: 0, dab: false }
  private readonly strokeSegment = new Vector4()
  private readonly strokeForce = new Vector2()
  private readonly currentFrom = new Vector2()
  private readonly currentTo = new Vector2()
  private readonly currentSegment = new Vector4()
  private readonly currentForce = new Vector2()

  private readonly low = new Vector3()
  private readonly high = new Vector3()
  private readonly fromLow = new Vector3()
  private readonly fromHigh = new Vector3()
  private readonly toLow = new Vector3()
  private readonly toHigh = new Vector3()
  private fromAlpha = 0
  private toAlpha = 0
  private paletteProgress = 1

  constructor(canvas: HTMLCanvasElement, private readonly host: HTMLElement, options: FluidOptions = {}) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" })
    const { extensions } = this.renderer
    if (!extensions.has("EXT_color_buffer_float") && !extensions.has("EXT_color_buffer_half_float")) {
      this.renderer.dispose()
      throw new Error("FluidSim: half-float render targets are not supported")
    }
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.autoClear = false

    const touch = options.touch ?? false
    this.substeps = touch ? 1 : 2
    // One substep must carry the impulse of two
    this.forceScale = 2 / this.substeps
    this.compactAlways = touch

    const shared = {
      uResolution: { value: this.grid },
      uStroke: { value: this.strokeSegment },
      uStrokeRadius: { value: STROKE.radius },
      uCurrent: { value: this.currentSegment },
      uCurrentRadius: { value: CURRENT.radius },
    }

    // Single-pass solver from the reference sketch: self-advection, viscosity, a pressure term
    // from the density gradient, vorticity confinement and soft walls, all in one texture.
    // Texel layout: xy velocity (cells per unit step), z density, w curl. Forces come from
    // splat.glsl, a round brush dragged along a segment and measured in cells so it stays
    // round on any aspect ratio.
    this.velocityPass = makeMaterial(splatGlsl + velocityFrag, {
      ...shared,
      uVelocity: { value: null },
      uStrokeForce: { value: this.strokeForce },
      uCurrentForce: { value: this.currentForce },
      uViscosity: { value: FLOW.viscosity },
      uVorticity: { value: FLOW.vorticity },
      uCurlLimit: { value: FLOW.curlLimit },
      uDamping: { value: Math.pow(FLOW.damping, 1 / this.substeps) },
      uMaxSpeed: { value: FLOW.maxSpeed },
    })

    // Ink density in the red channel: carried by the flow, fed by the pointer and the current,
    // decaying multiplicatively with a small linear floor so it reaches zero, and thinning
    // against the walls instead of piling up there. Colour is applied only on display.
    this.dyePass = makeMaterial(splatGlsl + dyeFrag, {
      ...shared,
      uVelocity: { value: null },
      uDye: { value: null },
      uStrokeInk: { value: 0 },
      uCurrentInk: { value: 0 },
      uAdvect: { value: FLOW.advect },
      uDecay: { value: FADE.decay },
      uFade: { value: FADE.fade },
    })

    // Upsamples the grid with a cubic B-spline (bilinear creases at a few pixels per cell),
    // maps density to the theme ramp, dithers below one 8-bit step so faint washes never band,
    // and writes premultiplied alpha so the canvas composites over the page like watercolour.
    this.displayPass = makeMaterial(displayFrag, {
      uDye: { value: null },
      uResolution: { value: this.grid },
      uLow: { value: this.low },
      uHigh: { value: this.high },
      uMaxAlpha: { value: 0 },
      uGain: { value: INK_GAIN },
    })

    // Carries a field onto a new grid size, rescaling velocities to the new cells
    this.resamplePass = makeMaterial(resampleFrag, {
      uSource: { value: null },
      uScale: { value: new Vector4(1, 1, 1, 1) },
    })

    this.quad = new Mesh(new PlaneGeometry(2, 2), this.velocityPass)
    this.quad.frustumCulled = false

    this.resize()
  }

  /** Matches the canvas to the host; rebuilds the grid only when its cell count changes. Returns whether anything changed. */
  resize(): boolean {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    if (width === this.width && height === this.height && pixelRatio === this.pixelRatio) return false

    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)

    const long = this.compactAlways || width < COMPACT_WIDTH ? GRID_LONG_COMPACT : GRID_LONG
    const aspect = width / height
    const gx = aspect >= 1 ? long : Math.max(GRID_MIN, Math.round(long * aspect))
    const gy = aspect >= 1 ? Math.max(GRID_MIN, Math.round(long / aspect)) : long
    if (gx !== this.grid.x || gy !== this.grid.y) this.rebuild(gx, gy)
    return true
  }

  /** Advances by a frame time in seconds. Returns whether there is a new frame to render. */
  step(dt: number): boolean {
    const fading = this.advancePalette(dt)
    this.accumulator += dt
    let ticks = 0
    while (this.accumulator >= TICK && ticks < MAX_TICKS_PER_FRAME) {
      this.tick()
      this.accumulator -= TICK
      ticks++
    }
    if (this.accumulator >= TICK) this.accumulator %= TICK
    return ticks > 0 || fading
  }

  /** Runs ticks synchronously, e.g. so a single still frame already shows the ambient wash. */
  prime(ticks: number) {
    for (let i = 0; i < ticks; i++) this.tick()
  }

  render() {
    if (!this.dye) return
    this.displayPass.uniforms.uDye.value = this.dye[0].texture
    this.draw(this.displayPass, null)
  }

  /** Sets the ink colours, cross-fading over half a second unless immediate. */
  setPalette(palette: FluidPalette, immediate = false) {
    this.toLow.fromArray(palette.low)
    this.toHigh.fromArray(palette.high)
    this.toAlpha = palette.maxAlpha
    this.fromLow.copy(this.low)
    this.fromHigh.copy(this.high)
    this.fromAlpha = this.displayPass.uniforms.uMaxAlpha.value
    this.paletteProgress = 0
    if (immediate) this.advancePalette(PALETTE_FADE)
  }

  /**
   * Feeds one pointer sample: x, y in CSS pixels from the host's top-left corner,
   * dx, dy the movement since the previous sample, strength a 0..1 multiplier.
   */
  pointer(x: number, y: number, dx: number, dy: number, strength = 1) {
    const s = this.stroke
    if (!s.active) {
      s.active = true
      s.x0 = x - dx
      s.y0 = y - dy
      s.strength = 0
    }
    s.x1 = x
    s.y1 = y
    s.strength = Math.max(s.strength, Math.min(Math.max(strength, 0), 1))
  }

  /**
   * A drop of ink where a touch lands. Touch scrolling cancels the pointer after a few pixels,
   * so on phones this, not the stroke, is what answers a finger.
   */
  dab(x: number, y: number) {
    this.pointer(x, y, 0, 0, 1)
    this.stroke.dab = true
  }

  dispose() {
    for (const target of [...(this.velocity ?? []), ...(this.dye ?? [])]) target.dispose()
    this.velocity = null
    this.dye = null
    for (const material of [this.velocityPass, this.dyePass, this.displayPass, this.resamplePass]) material.dispose()
    this.quad.geometry.dispose()
    this.renderer.dispose()
    // Hand the context back now rather than at garbage collection, so view transitions never pile them up
    this.renderer.forceContextLoss()
  }

  private tick() {
    if (!this.velocity || !this.dye) return
    this.time += TICK
    this.updateCurrent()
    this.updateStroke()

    const velocity = this.velocity
    for (let i = 0; i < this.substeps; i++) {
      this.velocityPass.uniforms.uVelocity.value = velocity[0].texture
      this.draw(this.velocityPass, velocity[1])
      velocity.reverse()
    }

    const dye = this.dye
    this.dyePass.uniforms.uVelocity.value = velocity[0].texture
    this.dyePass.uniforms.uDye.value = dye[0].texture
    this.draw(this.dyePass, dye[1])
    dye.reverse()
  }

  private draw(material: ShaderMaterial, target: WebGLRenderTarget | null) {
    this.quad.material = material
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.quad, this.camera)
  }

  /** New targets for a new grid size, carrying the current pool over so a resize never wipes it */
  private rebuild(gx: number, gy: number) {
    const velocity = makePair(gx, gy)
    const dye = makePair(gx, gy)
    const scale = this.resamplePass.uniforms.uScale.value as Vector4

    if (this.velocity && this.dye) {
      scale.set(gx / this.grid.x, gy / this.grid.y, 1, 1)
      this.resamplePass.uniforms.uSource.value = this.velocity[0].texture
      this.draw(this.resamplePass, velocity[0])
      scale.set(1, 1, 1, 1)
      this.resamplePass.uniforms.uSource.value = this.dye[0].texture
      this.draw(this.resamplePass, dye[0])
      for (const target of [...this.velocity, ...this.dye]) target.dispose()
    }

    this.velocity = velocity
    this.dye = dye
    this.grid.set(gx, gy)
  }

  /** The hidden stirrer's path, by phase: slow, smooth and kept to the open side of the hero on wide screens */
  private currentAt(phase: number, out: Vector2) {
    const wide = this.grid.x >= this.grid.y
    const cx = wide ? 0.7 : 0.5
    const ex = wide ? 0.2 : 0.3
    const cy = wide ? 0.52 : 0.45
    const ey = wide ? 0.3 : 0.28
    const u = cx + ex * (0.62 * Math.sin(phase + 0.4) + 0.38 * Math.sin(2.3 * phase + 2.1))
    const v = cy + ey * (0.58 * Math.sin(1.3 * phase + 1.7) + 0.42 * Math.sin(1.9 * phase + 0.3))
    return out.set(u * this.grid.x, v * this.grid.y)
  }

  private updateCurrent() {
    // Two incommensurate swells, so glides come every 5-10 s and never on a beat
    const t = this.time
    const swell = Math.min(Math.max(0.5 + 0.5 * Math.sin(0.9 * t) + 0.35 * Math.sin(0.55 * t + 1.3), 0), 1)
    const glide = swell * swell

    const from = this.currentAt(this.phase, this.currentFrom)
    this.phase += TICK * CURRENT.pace * (CURRENT.idle + (1 - CURRENT.idle) * glide)
    const to = this.currentAt(this.phase, this.currentTo)
    this.currentSegment.set(from.x, from.y, to.x, to.y)

    const length = Math.max(from.distanceTo(to), 1e-6)
    const force = (CURRENT.force * glide * this.forceScale) / length
    this.currentForce.set((to.x - from.x) * force, (to.y - from.y) * force)
    this.dyePass.uniforms.uCurrentInk.value = CURRENT.ink * glide
  }

  private updateStroke() {
    const s = this.stroke
    const ink = this.dyePass.uniforms.uStrokeInk
    if (!s.active) {
      this.strokeForce.set(0, 0)
      ink.value = 0
      return
    }
    s.active = false

    // Host CSS pixels to cells, with y flipped to texture space
    const kx = this.grid.x / this.width
    const ky = this.grid.y / this.height
    const ax = s.x0 * kx
    const ay = (this.height - s.y0) * ky
    const bx = s.x1 * kx
    const by = (this.height - s.y1) * ky
    this.strokeSegment.set(ax, ay, bx, by)

    const dx = bx - ax
    const dy = by - ay
    const travel = Math.hypot(dx, dy)
    const force = Math.min(travel * STROKE.force, STROKE.maxForce) * s.strength * this.forceScale
    const scale = travel > 1e-6 ? force / travel : 0
    this.strokeForce.set(dx * scale, dy * scale)

    const pace = Math.min(travel / STROKE.fullPace, 1)
    ink.value = Math.max(STROKE.ink * s.strength * Math.pow(pace, 1.5), s.dab ? STROKE.dab : 0)
    s.dab = false
  }

  /** Steps the theme cross-fade; returns whether the colours moved */
  private advancePalette(dt: number): boolean {
    if (this.paletteProgress >= 1) return false
    this.paletteProgress = Math.min(1, this.paletteProgress + dt / PALETTE_FADE)
    const p = this.paletteProgress
    const t = p * p * (3 - 2 * p)
    this.low.lerpVectors(this.fromLow, this.toLow, t)
    this.high.lerpVectors(this.fromHigh, this.toHigh, t)
    this.displayPass.uniforms.uMaxAlpha.value = this.fromAlpha + (this.toAlpha - this.fromAlpha) * t
    return true
  }
}
