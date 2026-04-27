<script setup lang="ts">
import SplatPlayground from '../components/lab/SplatPlayground.vue'
</script>

<template>
  <div class="page">
    <section class="page-hero">
      <div class="container">
        <div class="page-hero__panel">
          <div class="page-hero__copy">
            <span class="eyebrow">实验场</span>
            <h1>把图片采样成粒子，做一个接近 Gaussian splat 观感的创意网页工具。</h1>
            <p>
              这里不是文档页，而是一个整活实验。上传任意图片后，站点会用采样点重建画面，并用柔和粒子和鼠标扰动把它变成更具表现力的视觉对象。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <SplatPlayground />
      </div>
    </section>
  </div>
</template>
