<script setup lang="ts">
import { useHomeMix } from '@home-apps/vue'
import NotesPage from './NotesPage.vue'
import NotesWidget from './NotesWidget.vue'

// One build for both: the context says whether this frame is a widget (its size and place) or the page.
const { context, ready } = useHomeMix()
</script>

<template>
  <template v-if="ready">
    <NotesWidget v-if="context?.widget" />
    <NotesPage v-else />
  </template>
</template>
