<script setup lang="ts">
import { computed } from 'vue'
import type { Person } from './notes'

// Initials on a colour of the person's own. Pictures stay out: the sandbox's CSP allows no images from outside
// HomeApps, and avatars come from Google and the like (owner's call, 2026-11-16).
const props = defineProps<{ person: Person }>()

const initials = computed(() =>
  props.person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join(''),
)
const hue = computed(() => [...props.person.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7))
</script>

<template>
  <span class="avatar" :title="person.name" :aria-label="person.name" :style="{ background: `hsl(${hue} 55% 45%)` }">
    {{ initials }}
  </span>
</template>

<style scoped>
.avatar {
  width: 1.75em;
  height: 1.75em;
  flex: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8em;
  font-weight: 600;
}
</style>
