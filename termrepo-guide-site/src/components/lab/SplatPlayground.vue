<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

type Particle = {
  x: number
  y: number
  baseX: number
  baseY: number
  scatterX: number
  scatterY: number
  radius: number
  color: string
  alpha: number
  wobbleSeed: number
}

type PointerState = {
  x: number
  y: number
  active: boolean
}

const previewHost = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const state = reactive({
  sampleStep: 8,
  particleSize: 3.2,
  softness: 0.82,
  scatter: 38,
  alphaThreshold: 24,
})

const renderState = reactive({
  width: 920,
  height: 560,
  imageName: 'TermRepo 示例图',
  particleCount: 0,
  isBusy: false,
})

const pointer = reactive<PointerState>({
  x: 0,
  y: 0,
  active: false,
})

const particles = ref<Particle[]>([])
let resizeObserver: ResizeObserver | null = null
let animationFrameId = 0
let compositionStart = 0
let sourceImage: HTMLImageElement | null = null
let regenerateTimeout = 0

const stats = computed(() => [
  { label: '粒子数量', value: renderState.particleCount.toLocaleString() },
  { label: '采样间距', value: `${state.sampleStep}px` },
  { label: '柔化程度', value: `${Math.round(state.softness * 100)}%` },
])

function openFilePicker() {
  fileInputRef.value?.click()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pickCanvasSize() {
  const host = previewHost.value

  if (!host) {
    return { width: 920, height: 560 }
  }

  const bounds = host.getBoundingClientRect()
  const width = clamp(Math.floor(bounds.width), 320, 920)
  const height = clamp(Math.floor(width * 0.62), 280, 560)

  return { width, height }
}

function updateCanvasSize() {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  const { width, height } = pickCanvasSize()
  const dpr = window.devicePixelRatio || 1

  renderState.width = width
  renderState.height = height
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(dpr, dpr)
}

function createDemoImage() {
  const offscreen = document.createElement('canvas')
  const width = 920
  const height = 560
  offscreen.width = width
  offscreen.height = height

  const context = offscreen.getContext('2d')

  if (!context) {
    return Promise.reject(new Error('No canvas context'))
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  const halo = context.createRadialGradient(width * 0.5, height * 0.36, 40, width * 0.5, height * 0.36, 240)
  halo.addColorStop(0, 'rgba(10, 114, 239, 0.18)')
  halo.addColorStop(0.5, 'rgba(222, 29, 141, 0.08)')
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = halo
  context.fillRect(0, 0, width, height)

  context.fillStyle = '#171717'
  context.font = '600 136px Geist, Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('粒子化', width * 0.5, height * 0.34)

  context.font = '500 24px Geist Mono, monospace'
  context.fillStyle = '#4d4d4d'
  context.fillText('术语像素实验室', width * 0.5, height * 0.48)

  const ribbon = context.createLinearGradient(width * 0.22, height * 0.64, width * 0.78, height * 0.78)
  ribbon.addColorStop(0, '#0a72ef')
  ribbon.addColorStop(0.52, '#de1d8d')
  ribbon.addColorStop(1, '#ff5b4f')
  context.fillStyle = ribbon

  context.beginPath()
  context.moveTo(width * 0.25, height * 0.66)
  context.bezierCurveTo(width * 0.38, height * 0.56, width * 0.58, height * 0.84, width * 0.75, height * 0.7)
  context.lineWidth = 26
  context.lineCap = 'round'
  context.strokeStyle = ribbon
  context.stroke()

  const image = new Image()
  const dataUrl = offscreen.toDataURL('image/png')

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to create demo image'))
    image.src = dataUrl
  })
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function buildParticlesFromImage(image: HTMLImageElement) {
  const offscreen = document.createElement('canvas')
  const width = renderState.width
  const height = renderState.height
  offscreen.width = width
  offscreen.height = height

  const context = offscreen.getContext('2d', { willReadFrequently: true })

  if (!context) {
    particles.value = []
    renderState.particleCount = 0
    return
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  const safeWidth = width - 72
  const safeHeight = height - 72
  const scale = Math.min(safeWidth / image.width, safeHeight / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const drawX = (width - drawWidth) / 2
  const drawY = (height - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  const imageData = context.getImageData(0, 0, width, height)
  const nextParticles: Particle[] = []
  const fadeAlpha = clamp(state.softness * 0.92, 0.25, 0.94)

  for (let y = 0; y < height; y += state.sampleStep) {
    for (let x = 0; x < width; x += state.sampleStep) {
      const index = (y * width + x) * 4
      const red = imageData.data[index] ?? 0
      const green = imageData.data[index + 1] ?? 0
      const blue = imageData.data[index + 2] ?? 0
      const alpha = imageData.data[index + 3] ?? 0

      if (alpha < state.alphaThreshold) {
        continue
      }
      const brightness = (red + green + blue) / 3

      if (brightness > 248 && alpha > 248) {
        continue
      }

      const normalizedAlpha = alpha / 255
      const normalizedBrightness = brightness / 255
      const weight = 0.55 + (1 - normalizedBrightness) * 0.45
      const radius = state.particleSize * (0.7 + normalizedAlpha * 0.55 + weight * 0.25)
      const jitter = state.scatter

      nextParticles.push({
        x: x + (Math.random() - 0.5) * jitter,
        y: y + (Math.random() - 0.5) * jitter,
        baseX: x,
        baseY: y,
        scatterX: x + (Math.random() - 0.5) * jitter * 4.2,
        scatterY: y + (Math.random() - 0.5) * jitter * 4.2,
        radius,
        color: rgba(red, green, blue, fadeAlpha),
        alpha: normalizedAlpha,
        wobbleSeed: Math.random() * Math.PI * 2,
      })
    }
  }

  particles.value = nextParticles
  renderState.particleCount = nextParticles.length
  compositionStart = performance.now()
}

function renderFrame(timestamp: number) {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  const width = renderState.width
  const height = renderState.height
  const intro = clamp((timestamp - compositionStart) / 900, 0, 1)
  const easedIntro = 1 - Math.pow(1 - intro, 3)

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  const panelGradient = context.createLinearGradient(0, 0, width, height)
  panelGradient.addColorStop(0, 'rgba(10, 114, 239, 0.035)')
  panelGradient.addColorStop(0.48, 'rgba(255, 255, 255, 0)')
  panelGradient.addColorStop(1, 'rgba(255, 91, 79, 0.03)')
  context.fillStyle = panelGradient
  context.fillRect(0, 0, width, height)

  for (const particle of particles.value) {
    const introX = particle.scatterX + (particle.baseX - particle.scatterX) * easedIntro
    const introY = particle.scatterY + (particle.baseY - particle.scatterY) * easedIntro
    const wave = Math.sin(timestamp * 0.0018 + particle.wobbleSeed) * 1.8
    const bob = Math.cos(timestamp * 0.0012 + particle.wobbleSeed * 1.2) * 1.8

    let repulseX = 0
    let repulseY = 0

    if (pointer.active) {
      const dx = introX - pointer.x
      const dy = introY - pointer.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1
      const influence = Math.max(0, 1 - distance / 110)
      const force = influence * influence * 24
      repulseX = (dx / distance) * force
      repulseY = (dy / distance) * force
    }

    const drawX = introX + wave + repulseX
    const drawY = introY + bob + repulseY
    const radius = particle.radius
    const gradient = context.createRadialGradient(drawX, drawY, 0, drawX, drawY, radius * 2.8)
    gradient.addColorStop(0, particle.color)
    gradient.addColorStop(0.45, particle.color)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    context.fillStyle = gradient
    context.beginPath()
    context.arc(drawX, drawY, radius * 2.8, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = particle.color.replace(/[\d.]+\)$/u, `${clamp(particle.alpha * 0.9, 0.1, 0.95)})`)
    context.beginPath()
    context.arc(drawX, drawY, radius * 0.66, 0, Math.PI * 2)
    context.fill()
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

async function regenerate() {
  if (!sourceImage) {
    return
  }

  renderState.isBusy = true

  try {
    updateCanvasSize()
    buildParticlesFromImage(sourceImage)
  } finally {
    renderState.isBusy = false
  }
}

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file)
  const image = new Image()

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = objectUrl
  })

  URL.revokeObjectURL(objectUrl)
  sourceImage = image
  renderState.imageName = file.name
  await regenerate()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  await loadImageFromFile(file)
}

function resetToDemo() {
  createDemoImage().then((image) => {
    sourceImage = image
    renderState.imageName = 'TermRepo 示例图'
    return regenerate()
  })
}

function onPointerMove(event: PointerEvent) {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  const bounds = canvas.getBoundingClientRect()
  pointer.x = event.clientX - bounds.left
  pointer.y = event.clientY - bounds.top
  pointer.active = true
}

function onPointerLeave() {
  pointer.active = false
}

watch(
  () => [state.sampleStep, state.particleSize, state.softness, state.scatter, state.alphaThreshold],
  () => {
    window.clearTimeout(regenerateTimeout)
    regenerateTimeout = window.setTimeout(() => {
      regenerate()
    }, 120)
  },
)

onMounted(async () => {
  updateCanvasSize()

  resizeObserver = new ResizeObserver(() => {
    regenerate()
  })

  if (previewHost.value) {
    resizeObserver.observe(previewHost.value)
  }

  sourceImage = await createDemoImage()
  await regenerate()
  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onUnmounted(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  if (regenerateTimeout) {
    window.clearTimeout(regenerateTimeout)
  }
})
</script>

<template>
  <section class="lab-layout">
    <aside class="tool-panel">
      <div class="tool-panel__header">
        <span class="eyebrow">创意工具</span>
        <h2>图片粒子化实验台</h2>
        <p>
          上传一张图片，按像素采样并重组成柔软粒子，让它呈现接近 Gaussian splat 的 2D 观感。
        </p>
      </div>

      <div class="tool-panel__actions">
        <button class="button button--dark" type="button" @click="openFilePicker">
          上传图片
        </button>
        <button class="button button--ghost" type="button" @click="resetToDemo">
          使用示例图
        </button>
        <input
          ref="fileInputRef"
          class="tool-panel__file"
          type="file"
          accept="image/*"
          @change="onFileChange"
        />
      </div>

      <div class="tool-panel__stats">
        <article v-for="item in stats" :key="item.label" class="metric-card">
          <span class="metric-card__value">{{ item.value }}</span>
          <span class="metric-card__label">{{ item.label }}</span>
        </article>
      </div>

      <div class="control-list">
        <label class="control-item">
          <span class="control-item__label">采样密度</span>
          <span class="control-item__value">{{ state.sampleStep }} px</span>
          <input v-model.number="state.sampleStep" type="range" min="4" max="18" step="1" />
        </label>

        <label class="control-item">
          <span class="control-item__label">粒子尺寸</span>
          <span class="control-item__value">{{ state.particleSize.toFixed(1) }}</span>
          <input v-model.number="state.particleSize" type="range" min="1.4" max="6.5" step="0.1" />
        </label>

        <label class="control-item">
          <span class="control-item__label">柔化程度</span>
          <span class="control-item__value">{{ Math.round(state.softness * 100) }}%</span>
          <input v-model.number="state.softness" type="range" min="0.35" max="1" step="0.01" />
        </label>

        <label class="control-item">
          <span class="control-item__label">散开强度</span>
          <span class="control-item__value">{{ state.scatter }} px</span>
          <input v-model.number="state.scatter" type="range" min="10" max="80" step="1" />
        </label>

        <label class="control-item">
          <span class="control-item__label">透明阈值</span>
          <span class="control-item__value">{{ state.alphaThreshold }}</span>
          <input v-model.number="state.alphaThreshold" type="range" min="0" max="120" step="1" />
        </label>
      </div>

      <div class="tool-panel__note">
        <span class="pill">当前图片</span>
        <p>{{ renderState.imageName }}</p>
      </div>
    </aside>

    <div ref="previewHost" class="lab-stage">
      <div class="lab-stage__header">
        <div>
          <span class="eyebrow">画布预览</span>
          <h3>把采样像素重建成柔和粒子</h3>
        </div>
        <span class="pill pill--accent">{{ renderState.isBusy ? '正在重建' : '可交互' }}</span>
      </div>

      <div class="lab-stage__canvas-wrap">
        <canvas
          ref="canvasRef"
          class="lab-stage__canvas"
          @pointermove="onPointerMove"
          @pointerleave="onPointerLeave"
        />
      </div>

      <div class="lab-stage__hint">
        <p>把鼠标移到画布上可以扰动粒子。重新上传任意图片后，会按当前参数重新采样。</p>
      </div>
    </div>
  </section>
</template>
