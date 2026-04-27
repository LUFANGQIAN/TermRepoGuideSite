<script setup lang="ts">
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
</script>

<template>
  <div class="page">
    <section class="page-hero" id="start">
      <div class="container">
        <div class="page-hero__panel">
          <div class="page-hero__copy">
            <span class="eyebrow">使用指南</span>
            <h1>按真实任务流组织，而不是把功能点散着堆在一起。</h1>
            <p>
              对这个项目来说，最好用的指南结构是从安装开始，到收藏第一个术语、管理词库、再次复用，再到导入导出收尾。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="guide-grid">
          <div class="step-list">
            <article v-for="step in site.guideSteps" :key="step.index" class="step-card">
              <span class="step-card__index">Step {{ step.index }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
              <ul class="bullet-list">
                <li v-for="tip in step.tips" :key="tip">{{ tip }}</li>
              </ul>
              <div v-if="step.snippet" class="code-block">
                <code>{{ step.snippet }}</code>
              </div>
            </article>
          </div>

          <aside class="page-hero__aside">
            <article class="card">
              <span class="card__kicker">推荐理解方式</span>
              <h3>收藏术语 -> 理解术语 -> 管理词库 -> 再次复用</h3>
              <p>
                这是当前插件已经跑通的本地闭环，也是写页面说明和产品文案时最值得稳定复用的一条主线。
              </p>
            </article>

            <article class="card">
              <span class="card__kicker">当前安装表达</span>
              <h3>先保持真实，不虚构未确认的发布方式。</h3>
              <p>
                在本指南站里，安装步骤应以当前项目实际分发方式为准。如果未来进入市场上架或官网分发，再补更细的下载入口即可。
              </p>
            </article>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>
