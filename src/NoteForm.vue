<script setup lang="ts">
import { computed, ref } from 'vue'
import { HmDate } from '@home-apps/vue'
import { MAX_LENGTH, validate } from './notes'

// A new note or a correction: up to 64 characters, shown from one day until another (today by default).
const props = defineProps<{ today: string; text?: string; from?: string; until?: string; submit: string }>()
const emit = defineEmits<{ save: [text: string, from: string, until: string]; cancel: [] }>()

const text = ref(props.text ?? '')
const from = ref(props.from ?? props.today)
const until = ref(props.until ?? props.today)
const days = ref(from.value !== until.value)
const touched = ref(false)
const error = computed(() => validate(text.value, from.value, days.value ? until.value : from.value, props.today))

function save() {
  touched.value = true
  if (error.value) return
  emit('save', text.value, from.value, days.value ? until.value : from.value)
  if (props.text === undefined) {
    text.value = ''
    touched.value = false
  }
}
</script>

<template>
  <form class="hm-stack" @submit.prevent="save">
    <div class="hm-row">
      <input
        v-model="text"
        class="hm-input hm-grow"
        :maxlength="MAX_LENGTH"
        placeholder="Np. Odbierz paczkę z paczkomatu"
        aria-label="Treść notatki"
      />
      <span class="hm-muted hm-small count">{{ text.trim().length }}/{{ MAX_LENGTH }}</span>
    </div>
    <div class="hm-row wrap">
      <HmDate v-model="from" :label="days ? 'Od' : 'Dzień'" />
      <HmDate v-if="days" v-model="until" label="Do" />
      <label class="hm-row hm-small">
        <input v-model="days" type="checkbox" />
        Na kilka dni
      </label>
    </div>
    <p v-if="touched && error" class="hm-error">{{ error }}</p>
    <div class="hm-row">
      <button class="hm-button">{{ submit }}</button>
      <button v-if="props.text !== undefined" type="button" class="hm-button text" @click="emit('cancel')">
        Anuluj
      </button>
    </div>
  </form>
</template>

<style scoped>
.count {
  min-width: 3.5em;
  text-align: right;
}
.wrap {
  flex-wrap: wrap;
  align-items: end;
}
</style>
