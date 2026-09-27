export const PHONE_LABELS = ['mobile', 'home', 'work', 'other']
export const EMAIL_LABELS = ['personal', 'work', 'other']

export const emptyContact = () => ({
  id: null,
  firstName: '',
  lastName: '',
  company: '',
  jobTitle: '',
  phones: [{ label: 'mobile', value: '' }],
  emails: [{ label: 'personal', value: '' }],
  address: { street: '', city: '', state: '', postalCode: '', country: '' },
  birthday: '',
  notes: '',
  tags: [],
  favorite: false,
})

export function displayName(contact) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
  return name || contact.company || 'Unnamed contact'
}

export function initials(contact) {
  const parts = [contact.firstName, contact.lastName].filter(Boolean)
  const source = parts.length ? parts : [contact.company || '?']
  return source
    .map((p) => p.trim()[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function matchesQuery(contact, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    contact.firstName,
    contact.lastName,
    contact.company,
    contact.jobTitle,
    contact.notes,
    ...contact.tags,
    ...contact.phones.map((p) => p.value),
    ...contact.emails.map((e) => e.value),
    ...Object.values(contact.address),
  ]
    .join(' ')
    .toLowerCase()
  const digits = q.replace(/\D/g, '')
  const phoneMatch =
    digits.length >= 3 && contact.phones.some((p) => p.value.replace(/\D/g, '').includes(digits))
  return haystack.includes(q) || phoneMatch
}

export const compareContacts = (a, b) =>
  displayName(a).localeCompare(displayName(b), undefined, { sensitivity: 'base' })

// Drop blank rows/fields so the encrypted vault stays small and tidy.
export function normalizeContact(draft) {
  const trim = (s) => (s ?? '').trim()
  return {
    ...draft,
    firstName: trim(draft.firstName),
    lastName: trim(draft.lastName),
    company: trim(draft.company),
    jobTitle: trim(draft.jobTitle),
    phones: draft.phones.map((p) => ({ ...p, value: trim(p.value) })).filter((p) => p.value),
    emails: draft.emails.map((e) => ({ ...e, value: trim(e.value) })).filter((e) => e.value),
    address: Object.fromEntries(Object.entries(draft.address).map(([k, v]) => [k, trim(v)])),
    notes: draft.notes.trim(),
    tags: [...new Set(draft.tags.map(trim).filter(Boolean))],
  }
}
