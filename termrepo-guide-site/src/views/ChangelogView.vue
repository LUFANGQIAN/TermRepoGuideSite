<script setup lang="ts">
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
</script>

<template>
  <div class="page">
    <section class="page-hero">
      <div class="container">
        <div class="page-hero__panel">
          <div class="page-hero__copy">
            <span class="eyebrow">更新日志</span>
            <h1>先记录阶段性结果，再把下一步讲得准确一点。</h1>
            <p>
              当前项目还处在早期阶段，所以更新日志更适合记录能力成熟度、站点进度和明确的下一步，而不是制造过多版本噪声。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="timeline-grid">
          <article v-for="entry in site.changelog" :key="entry.title" class="timeline-item">
            <div class="timeline-item__meta">
              <span>{{ entry.date }}</span>
              <span class="pill pill--accent">{{ entry.label }}</span>
            </div>
            <h3>{{ entry.title }}</h3>
            <p>{{ entry.summary }}</p>
            <ul class="bullet-list">
              <li v-for="item in entry.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
