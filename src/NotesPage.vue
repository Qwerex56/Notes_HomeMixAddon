<script setup lang="ts">
import { ref } from 'vue'
import { HmEmpty, HmPage, useHomeMix } from '@home-apps/vue'
import Avatar from './Avatar.vue'
import LikeButton from './LikeButton.vue'
import NoteForm from './NoteForm.vue'
import { shortDay, time } from './days'
import { useNotes, type Note } from './notes'

// The page: add a note, correct your own (Admins any), mark one done, confirm with a like; planned ones below.
const { context, homemix } = useHomeMix()
const { current, planned, today, loading, error, canWrite, canEdit, add, edit, done, toggleLike } = useNotes()
const editing = ref<string | null>(null)

async function run(action: () => Promise<unknown>) {
  try {
    await action()
  } catch (e) {
    const code = (e as { code?: string }).code
    const message =
      code === 'homemix.conflict'
        ? 'Ktoś zmienił tę notatkę w międzyczasie. Spróbuj jeszcze raz.'
        : code === 'homemix.read_only'
          ? 'Nie masz uprawnień do tej zmiany.'
          : (e as Error).message
    await homemix.toast(message, 'error').catch(() => undefined)
  }
}

/** When it shows: the days for a longer or a later note, else the time it was added. */
const when = (n: Note) =>
  n.from !== n.until ? `${shortDay(n.from)} – ${shortDay(n.until)}` : n.from > today.value ? shortDay(n.from) : time(n.createdAt)
</script>

<template>
  <HmPage title="Notatki domowe" :subtitle="context?.household?.name ?? ''">
    <section v-if="canWrite" class="hm-card">
      <NoteForm :today="today" submit="Dodaj notatkę" @save="(t, f, u) => run(() => add(t, f, u))" />
    </section>
    <p v-if="error" class="hm-error">{{ error.message }}</p>
    <div v-if="loading" class="hm-loading" />
    <template v-else>
      <h2 class="hm-subtitle">Dziś</h2>
      <HmEmpty v-if="!current.length" icon="📌" text="Na dziś brak notatek." />
      <template v-for="list in [current, planned]" :key="list === current ? 'now' : 'later'">
        <h2 v-if="list === planned && planned.length" class="hm-subtitle">Zaplanowane</h2>
        <ul class="notes hm-stack">
          <li v-for="n in list" :key="n.id" class="hm-card hm-stack">
            <NoteForm
              v-if="editing === n.id"
              :today="today"
              :text="n.text"
              :from="n.from"
              :until="n.until"
              submit="Zapisz"
              @save="(t, f, u) => run(() => edit(n, t, f, u)).then(() => (editing = null))"
              @cancel="editing = null"
            />
            <template v-else>
              <div class="hm-row">
                <Avatar :person="n.person" />
                <strong class="hm-grow hm-truncate">{{ n.person.name }}</strong>
                <span class="hm-muted hm-small">{{ when(n) }}</span>
              </div>
              <p class="text">{{ n.text }}</p>
              <div class="hm-row">
                <LikeButton :note="n" @toggle="run(() => toggleLike(n))" />
                <span class="hm-grow hm-muted hm-small hm-truncate">
                  {{ n.likes.map((p) => p.name).join(', ') }}
                </span>
                <button v-if="canEdit(n)" type="button" class="hm-button text" @click="editing = n.id">Popraw</button>
                <button v-if="canWrite" type="button" class="hm-button secondary" @click="run(() => done(n))">
                  ✓ Gotowe
                </button>
              </div>
            </template>
          </li>
        </ul>
      </template>
    </template>
  </HmPage>
</template>

<style scoped>
.notes {
  list-style: none;
  margin: 0;
  padding: 0;
}
.text {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
