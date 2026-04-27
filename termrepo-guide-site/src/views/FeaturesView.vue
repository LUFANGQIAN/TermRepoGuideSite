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
            <span class="eyebrow">功能介绍</span>
            <h1>先把已经成立的能力讲清楚，再谈未来增强。</h1>
            <p>
              TermRepo 当前已经具备完整的本地词库闭环。AI 建议、云同步、网页端管理等能力属于后续增强项，不是当前产品成立的前提。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="card-grid">
          <article v-for="feature in site.features" :key="feature.title" class="card">
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
        <div class="guide-grid">
          <article class="card">
            <span class="card__kicker">边界</span>
            <h3>插件适合承担高频操作，不适合塞进所有平台职责。</h3>
            <p>
              收藏、搜索、编辑器内复用和本地管理这些高频动作继续留在插件里，更重的管理与服务能力才考虑由未来网页端承接。
            </p>
          </article>

          <article class="card">
            <span class="card__kicker">原则</span>
            <h3>AI 和同步必须是增强层，而不是门槛。</h3>
            <p>
              后端与云服务未来主要服务于 AI 默认备注建议、内测资格、云同步和多端共享，但它们不应破坏本地优先的核心原则。
            </p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
