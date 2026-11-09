<script setup>
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()

// Link to the English original: /es/foo → /foo (route.path is base-relative).
const englishPath = computed(() => withBase(route.path.replace(/^\/es(?=\/)/, '')))
</script>

<template>
  <div class="translation-pending" role="note">
    <p class="title">Página aún sin traducir</p>
    <p>
      Esta página aún no ha sido traducida al español — el contenido a continuación está en inglés.
      <a :href="englishPath">Ver la versión original en inglés.</a>
    </p>
  </div>
</template>

<style scoped>
.translation-pending {
  border: 1px solid var(--vp-c-brand-1);
  border-left-width: 4px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  padding: 12px 16px;
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
}

.translation-pending .title {
  font-weight: 600;
  margin: 0 0 4px;
}

.translation-pending p:last-child {
  margin: 0;
}
</style>
