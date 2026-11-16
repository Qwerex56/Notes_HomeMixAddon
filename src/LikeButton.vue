<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from './notes'

// The note's "okejki": a count, and a toggle for everyone but the author (it confirms someone else read it).
const props = defineProps<{ note: Note }>()
const emit = defineEmits<{ toggle: [] }>()
const who = computed(() => props.note.likes.map((p) => p.name).join(', ') || 'Nikt jeszcze nie potwierdził')
</script>

<template>
  <button
    v-if="!note.mine"
    type="button"
    class="hm-button like"
    :class="note.likedByMe ? '' : 'secondary'"
    :title="who"
    :aria-pressed="note.likedByMe"
    :aria-label="`Okejka, ${note.likes.length}`"
    @click.stop="emit('toggle')"
  >
    👍 {{ note.likes.length }}
  </button>
  <span v-else class="hm-chip like" :title="who">👍 {{ note.likes.length }}</span>
</template>

<style scoped>
.like {
  flex: none;
  padding: 0.25em 0.6em;
  white-space: nowrap;
}
</style>
