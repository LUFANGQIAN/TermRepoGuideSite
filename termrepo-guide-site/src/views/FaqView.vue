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
            <span class="eyebrow">FAQ</span>
            <h1>把用户最先会担心的问题，提前回答掉。</h1>
            <p>
              指南站不是管理后台，所以 FAQ 更应该回答使用边界、数据归属、联网依赖和未来方向，而不是账号运营问题。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <article class="faq-card">
          <h3>常见问题</h3>
          <p>以下回答基于当前项目文档与现阶段产品边界整理。</p>

          <details v-for="item in site.faqs" :key="item.question">
            <summary>{{ item.question }}</summary>
            <p>{{ item.answer }}</p>
          </details>
        </article>
      </div>
    </section>
  </div>
</template>
