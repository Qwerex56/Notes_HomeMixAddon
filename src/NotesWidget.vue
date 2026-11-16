<script setup lang="ts">
import { computed } from 'vue'
import { HmEmpty, HmWidget, useWidget } from '@home-apps/vue'
import Avatar from './Avatar.vue'
import LikeButton from './LikeButton.vue'
import { time } from './days'
import { useNotes } from './notes'

// Small: one line per note (who | text | likes), Medium: who, name and time above the text, Large: the same, more notes.
const { current, loading, toggleLike } = useNotes()
const { size } = useWidget()
const shown = computed(() => current.value.slice(0, size.value === 'Large' ? 10 : 4))
const more = computed(() => current.value.length - shown.value.length)
</script>

<template>
  <HmWidget title="Notatki" icon="📌">
    <div v-if="loading" class="hm-loading" />
    <HmEmpty v-else-if="!current.length" icon="📌" text="Na dziś brak notatek" />
    <ul v-else class="notes hm-stack">
      <li v-for="n in shown" :key="n.id" :class="size === 'Small' ? 'hm-row' : 'hm-stack tight'">
        <template v-if="size === 'Small'">
          <Avatar :person="n.person" />
          <span class="hm-grow hm-truncate" :title="n.text">{{ n.text }}</span>
          <LikeButton :note="n" @toggle="toggleLike(n)" />
        </template>
        <template v-else>
          <div class="hm-row">
            <Avatar :person="n.person" />
            <strong class="hm-grow hm-truncate">{{ n.person.name }}</strong>
            <span class="hm-muted hm-small">{{ time(n.createdAt) }}</span>
          </div>
          <div class="hm-row">
            <span class="hm-grow text">{{ n.text }}</span>
            <LikeButton :note="n" @toggle="toggleLike(n)" />
          </div>
        </template>
      </li>
    </ul>
    <template v-if="more > 0" #footer>i jeszcze {{ more }}…</template>
  </HmWidget>
</template>

<style scoped>
.notes {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tight {
  gap: 0.25rem;
}
.text {
  overflow-wrap: anywhere;
}
</style>
