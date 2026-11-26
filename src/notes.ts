// Notes and their likes ("okejki"), on top of the add-on's household storage (docs/homemix.md, "Data").
import { computed, ref, shallowRef, watch } from 'vue'
import { useCollection, useHomeMix } from '@home-apps/vue'
import { useToday } from './days'

export const MAX_LENGTH = 64

/** notes/{id}: author is kept apart from updatedBy, which an Admin's correction changes. */
export interface NoteValue {
  text: string
  from: string
  until: string
  author: string
  createdAt: string
}

/** likes/{noteId}.{userId without dashes}: one document per person, so two likes at once never conflict. */
export interface LikeValue {
  note: string
  user: string
}

export interface Person {
  id: string
  name: string
  avatarUrl: string | null
}

export interface Note extends NoteValue {
  id: string
  person: Person
  likes: Person[]
  likedByMe: boolean
  mine: boolean
}

// Keys are at most 64 characters: 12 for a note, 32 for a person.
const newNoteId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)
const likeKey = (note: string, user: string) => `${note}.${user.replace(/-/g, '')}`

/** End of the `until` day (local midnight after it) as ISO: the host hides and purges the document then. */
export function expiryOf(until: string): string {
  const end = new Date(`${until}T00:00`)
  end.setDate(end.getDate() + 1)
  return end.toISOString()
}

export function validate(text: string, from: string, until: string, today: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return 'Wpisz treść notatki.'
  if (trimmed.length > MAX_LENGTH) return `Najwyżej ${MAX_LENGTH} znaki.`
  if (!from || !until) return 'Wybierz dni.'
  if (until < from) return '„Do” nie może być przed „od”.'
  if (until < today) return 'Ta notatka już by zniknęła.'
  return null
}

export function useNotes() {
  const { homemix, context } = useHomeMix()
  const notes = useCollection<NoteValue>('notes')
  const likes = useCollection<LikeValue>('likes')
  const today = useToday()
  const members = shallowRef<Person[]>([])

  void homemix
    .members()
    .then((list) => (members.value = list))
    .catch(() => (members.value = []))

  const me = computed(() => context.value?.user.id ?? '')
  const role = computed(() => context.value?.household?.myRole ?? 'Guest')
  const canWrite = computed(() => role.value !== 'Guest')
  const isAdmin = computed(() => role.value === 'Admin' || role.value === 'Owner')

  function person(id: string): Person {
    return (
      members.value.find((m) => m.id === id) ??
      (id === me.value && context.value ? { id, name: context.value.user.name, avatarUrl: null } : null) ?? {
        id,
        name: 'Były domownik',
        avatarUrl: null,
      }
    )
  }

  const all = computed<Note[]>(() =>
    notes.items.value
      .map((d) => {
        const liked = likes.items.value.filter((l) => l.value.note === d.key && l.value.user !== d.value.author)
        return {
          ...d.value,
          id: d.key,
          person: person(d.value.author),
          likes: liked.map((l) => person(l.value.user)),
          likedByMe: liked.some((l) => l.value.user === me.value),
          mine: d.value.author === me.value,
        }
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )

  /** Shown today, newest first. */
  const current = computed(() => all.value.filter((n) => n.from <= today.value && today.value <= n.until))
  /** Starting on a later day. */
  const planned = computed(() =>
    all.value.filter((n) => n.from > today.value).sort((a, b) => a.from.localeCompare(b.from)),
  )

  const canEdit = (n: Note) => canWrite.value && (n.mine || isAdmin.value)

  // useCollection.put takes no options, so write through the SDK with expiresAt and reload the collection.
  async function putNote(id: string, value: NoteValue) {
    const version = notes.items.value.find((d) => d.key === id)?.version
    await homemix.data.put('notes', id, value, { scope: 'household', version, expiresAt: expiryOf(value.until) })
    await notes.refresh()
  }

  async function add(text: string, from: string, until: string) {
    const id = newNoteId()
    const value: NoteValue = { text: text.trim(), from, until, author: me.value, createdAt: new Date().toISOString() }
    await putNote(id, value)
    // The rest of the household hears about it; over the limit (30/h) the note still stands.
    if (from <= today.value) {
      await homemix
        .push({ title: `${context.value?.user.name ?? 'Ktoś'}: nowa notatka`, body: value.text, tag: id })
        .catch(() => undefined)
    }
  }

  async function edit(n: Note, text: string, from: string, until: string) {
    const { id, person: _p, likes: _l, likedByMe: _b, mine: _m, ...value } = n
    await putNote(id, { ...value, text: text.trim(), from, until })
  }

  /** "Gotowe": the note goes, and its likes with it. */
  async function done(n: Note) {
    await notes.remove(n.id)
    await removeLikes(n.id)
  }

  async function toggleLike(n: Note) {
    const key = likeKey(n.id, me.value)
    if (n.likedByMe) await likes.remove(key)
    else {
      const value: LikeValue = { note: n.id, user: me.value }
      await homemix.data.put('likes', key, value, { scope: 'household', expiresAt: expiryOf(n.until) })
      await likes.refresh()
    }
  }

  async function removeLikes(note: string) {
    for (const l of likes.items.value.filter((x) => x.value.note === note)) {
      await likes.remove(l.key).catch(() => undefined)
    }
  }

  // Notes vanish at the end of their last day: whoever opens the add-on first clears them from the data.
  // Several devices may try at once; a note someone else removed already is fine.
  const cleaning = ref(false)
  async function cleanUp() {
    if (cleaning.value || !canWrite.value || notes.loading.value || likes.loading.value) return
    cleaning.value = true
    try {
      const ids = new Set(notes.items.value.map((d) => d.key))
      for (const d of notes.items.value.filter((d) => d.value.until < today.value)) {
        await notes.remove(d.key).catch(() => undefined)
        ids.delete(d.key)
      }
      for (const l of likes.items.value.filter((l) => !ids.has(l.value.note))) {
        await likes.remove(l.key).catch(() => undefined)
      }
    } finally {
      cleaning.value = false
    }
  }
  watch([today, () => notes.loading.value, () => likes.loading.value, canWrite], () => void cleanUp(), {
    immediate: true,
  })

  const loading = computed(() => notes.loading.value || likes.loading.value)
  const error = computed(() => notes.error.value ?? likes.error.value)

  return { current, planned, today, loading, error, canWrite, canEdit, add, edit, done, toggleLike }
}
