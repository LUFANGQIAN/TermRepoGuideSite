<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__panel">
        <div class="site-footer__copy">
          <strong>TermRepo 指南站</strong>
          <p>一个围绕开发者术语工作流构建的本地优先说明站。</p>
        </div>

        <div class="site-footer__links" aria-label="页脚导航">
          <RouterLink to="/features">功能介绍</RouterLink>
          <RouterLink to="/guide">使用指南</RouterLink>
          <RouterLink to="/faq">FAQ</RouterLink>
          <RouterLink to="/changelog">更新日志</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>
