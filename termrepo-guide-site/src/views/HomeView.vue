<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useSiteStore } from '../stores/site'

const site = useSiteStore()

const headlineSource = '把开发中遇到的术语，\n压缩成可复用的个人词库。'
const typedHeadline = ref('')
const isTypingDone = ref(false)
const heroProgress = ref(0)
const heroSectionRef = ref<HTMLElement | null>(null)
let typingTimer = 0
let scrollFrame = 0

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const typedHeadlineHtml = computed(() => {
  const safeText = escapeHtml(typedHeadline.value).replace('\n', '<br>')
  const cursor = '<span class="hero__cursor" aria-hidden="true"></span>'
  return `${safeText}${cursor}`
})

const pageStyle = computed(() => ({
  '--hero-progress': `${heroProgress.value}`,
}))

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function updateHeroProgress() {
  const heroSection = heroSectionRef.value

  if (!heroSection) {
    return
  }

  const viewportHeight = window.innerHeight || 1
  const rect = heroSection.getBoundingClientRect()
  const travel = viewportHeight * 0.78
  const rawProgress = clamp(-rect.top / travel, 0, 1)
  heroProgress.value = rawProgress
}

function onScroll() {
  if (scrollFrame) {
    return
  }

  scrollFrame = window.requestAnimationFrame(() => {
    updateHeroProgress()
    scrollFrame = 0
  })
}

onMounted(() => {
  let index = 0

  typingTimer = window.setInterval(() => {
    index += 1
    typedHeadline.value = headlineSource.slice(0, index)

    if (index >= headlineSource.length) {
      window.clearInterval(typingTimer)
      isTypingDone.value = true
    }
  }, 82)

  updateHeroProgress()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onUnmounted(() => {
  if (typingTimer) {
    window.clearInterval(typingTimer)
  }

  if (scrollFrame) {
    window.cancelAnimationFrame(scrollFrame)
  }

  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div class="page" :style="pageStyle">
    <section
      ref="heroSectionRef"
      class="page-hero page-hero--immersive"
    >
      <div class="container">
        <div class="hero hero--centered hero--immersive">
          <span class="eyebrow reveal reveal--1">本地优先的术语工作流</span>
          <h1
            class="hero__title reveal reveal--2"
            :class="{ 'hero__title--done': isTypingDone }"
            v-html="typedHeadlineHtml"
          ></h1>
          <p class="hero__lead reveal reveal--3">
            TermRepo 面向开发者术语积累、理解、管理与复用。它不是普通词典工具，而是一套贴近代码上下文的术语工作流。
          </p>
          <div class="button-row hero__actions reveal reveal--4">
            <RouterLink class="button button--dark" to="/guide">查看使用指南</RouterLink>
            <RouterLink class="button button--ghost" to="/features">了解核心功能</RouterLink>
            <RouterLink class="button button--ghost" to="/playground/splat">试试创意实验</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--tight section--after-hero">
      <div class="container">
        <div class="cta-panel cta-panel--lab">
          <div>
            <span class="eyebrow">创意页面</span>
            <h2>顺手做了一个整活入口：图片粒子化实验室。</h2>
            <p class="muted">
              上传任意图片后，页面会对图像做采样，并把结果重建为柔软粒子云，视觉上接近 2D 的 Gaussian splat。
            </p>
          </div>
          <div class="button-row">
            <RouterLink class="button button--dark" to="/playground/splat">打开实验页</RouterLink>
            <RouterLink class="button button--ghost" to="/guide">返回主文档流</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="workflow">
          <div class="workflow__header">
            <span class="eyebrow">工作流</span>
            <h2>收藏，理解，再复用。</h2>
            <p>
              首页最应该讲清楚的不是“功能很多”，而是这套工作流到底如何成立。
            </p>
          </div>

          <div class="workflow__track">
            <article
              v-for="(stage, index) in site.workflowStages"
              :key="stage.title"
              class="workflow-step reveal-card"
              :class="`workflow-step--${stage.tone}`"
              :style="{ '--delay': `${120 + index * 90}ms` }"
            >
              <span class="workflow-step__label">{{ stage.label }}</span>
              <h3>{{ stage.title }}</h3>
              <p>{{ stage.description }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-intro">
          <span class="eyebrow">核心判断</span>
          <h2>它更像开发者的术语资产库，而不是一个单词收藏夹。</h2>
          <p>
            首页最重要的任务，是让用户快速理解这是什么、为什么值得用、现在能做到什么。
          </p>
        </div>

        <div class="principle-grid">
          <article
            v-for="(item, index) in site.principles"
            :key="item.title"
            class="card reveal-card"
            :style="{ '--delay': `${index * 80}ms` }"
          >
            <span class="card__kicker">原则</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-intro">
          <span class="eyebrow">典型场景</span>
          <h2>从看到一个词，到下次还能把它用回来。</h2>
          <p>
            指南站需要说明的不只是功能点，还要把真实使用路径说清楚，让开发者看到自己会如何用上它。
          </p>
        </div>

        <div class="card-grid">
          <article
            v-for="(scene, index) in site.usageScenes"
            :key="scene.title"
            class="card reveal-card"
            :style="{ '--delay': `${index * 80}ms` }"
          >
            <span class="card__kicker">场景</span>
            <h3>{{ scene.title }}</h3>
            <p>{{ scene.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-intro">
          <span class="eyebrow">当前能力</span>
          <h2>插件本地闭环已经跑通，网页端先把说明站做好。</h2>
          <p>
            当前重点不是夸大未来能力，而是把已经成立的价值表达清楚，再为后续网页端与云能力预留空间。
          </p>
        </div>

        <div class="metric-grid metric-grid--four">
          <article
            v-for="(metric, index) in site.heroMetrics"
            :key="metric.label"
            class="metric-card reveal-card"
            :style="{ '--delay': `${index * 60}ms` }"
          >
            <span class="metric-card__value">{{ metric.value }}</span>
            <span class="metric-card__label">{{ metric.label }}</span>
          </article>
        </div>

        <div class="card-grid">
          <article
            v-for="(feature, index) in site.features.slice(0, 3)"
            :key="feature.title"
            class="card reveal-card"
            :style="{ '--delay': `${index * 80}ms` }"
          >
            <span class="card__kicker">{{ feature.status }}</span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <ul class="bullet-list">
              <li v-for="point in feature.points" :key="point">{{ point }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-panel">
          <span class="eyebrow">下一步</span>
          <h2>继续阅读完整指南，或者直接查看路线图与更新节奏。</h2>
          <p class="muted">
            首版指南站已经把内容结构铺好，接下来可以持续补充更细的安装说明、FAQ 和版本记录。
          </p>
          <div class="button-row">
            <RouterLink class="button button--primary" to="/guide">进入使用指南</RouterLink>
            <RouterLink class="button button--ghost" to="/changelog">查看更新日志</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
