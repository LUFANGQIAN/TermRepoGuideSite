<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useSiteStore } from '../../stores/site'

const site = useSiteStore()
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink class="brand-mark" to="/">
        <span class="brand-mark__dot"></span>
        <span class="brand-mark__meta">
          <span class="brand-mark__label">{{ site.brandName }}</span>
          <span class="brand-mark__caption">{{ site.siteLabel }}</span>
        </span>
      </RouterLink>

      <nav class="site-nav" aria-label="主导航">
        <RouterLink
          v-for="item in site.navItems"
          :key="item.to"
          :to="item.to"
          class="site-nav__link"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <RouterLink class="button button--small button--primary" to="/guide">
        阅读指南
      </RouterLink>
    </div>
  </header>
</template>
