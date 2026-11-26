# Notatki domowe

A HomeMix add-on for HomeApps (2.4.0+): short notes (up to 64 characters) for the household, shown for one day or
several, gone on their own after the last one. Household members confirm reading with a like ("okejka").

- **Page:** add a note (today, a day, or from-to), correct it (its author, or an Admin), mark it done (deletes it),
  like it. Notes starting later are listed under "Zaplanowane".
- **Widgets** (household page and wall tablet): Small, one line per note (who, text, likes), the 4 newest; Medium,
  who, name and time above the text, the 4 newest; Large, the same with 10.
- **Notification:** a new note for today goes to everyone else in the household (`notify.push`, tag = note id).

## Data (`storage.household`)

| Collection | Key | Value | Who writes |
|---|---|---|---|
| `notes` | 12 hex | `{ text, from, until, author, createdAt }`, days as local `YYYY-MM-DD` | Member and up |
| `likes` | `{note}.{user id without dashes}` | `{ note, user }` | everyone, guests too (`likes.write`) |

One like per document, so two people liking at once never conflict. A note is shown while `from <= today <= until`
(the device's local day); the first Member's device that opens the add-on after that deletes it and its likes. The
wall tablet checks the day every minute. Pictures: initials only; the sandbox's CSP blocks avatars from outside HomeApps.

From 3.0 notes and likes are written with `expiresAt` (end of the `until` day), so the host purges them too. Notes created
before 3.0 have no `expiresAt` and are removed by the client cleanup only.

## Scripts

- `npm run dev`: a fake HomeApps at http://localhost:5180 with a household, roles and data in memory.
- `npm run check`: the checks HomeApps makes when the add-on is added.
- `npm run pack`: `addon.zip` and its SHA-256.

Install it in HomeApps from this repository's link (the latest release's `addon.zip`) or from the zip. Releasing (tag
`v1.0.0`, the workflow attaches `addon.zip`): https://github.com/Qwerex56/HomeApps/blob/master/docs/homemix-authoring.md
