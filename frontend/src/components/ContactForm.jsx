import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { EMAIL_LABELS, emptyContact, normalizeContact, PHONE_LABELS } from '../store/contacts'
import { Button, ErrorBanner, Field, inputClass } from './ui'

function MultiValueField({ title, noun, items, labels, type, onChange }) {
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  return (
    <div>
      <p className="mb-1 text-[13px] font-medium text-neutral-700">{title}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <div className="w-28 shrink-0">
              <select
                className={`${inputClass} capitalize`}
                value={item.label}
                onChange={(e) => update(index, { label: e.target.value })}
              >
                {labels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <input
              className={`${inputClass} min-w-0`}
              type={type}
              value={item.value}
              onChange={(e) => update(index, { value: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${noun}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { label: labels[0], value: '' }])}
        className="mt-1.5 text-[13px] text-blue-600 hover:underline"
      >
        Add {noun}
      </button>
    </div>
  )
}

export default function ContactForm({ contact, onSave, onClose }) {
  const [draft, setDraft] = useState(() => {
    const base = contact ?? emptyContact()
    return { ...structuredClone(base), tagsText: base.tags.join(', ') }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setAddress = (patch) => setDraft((d) => ({ ...d, address: { ...d.address, ...patch } }))

  async function handleSubmit(e) {
    e.preventDefault()
    const { tagsText, ...rest } = draft
    const normalized = normalizeContact({ ...rest, tags: tagsText.split(',') })
    if (!normalized.firstName && !normalized.lastName && !normalized.company) {
      return setError('Enter a name or company.')
    }
    setError('')
    setBusy(true)
    try {
      await onSave(normalized)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const text = (key, props = {}) => (
    <input className={inputClass} value={draft[key]} onChange={(e) => set({ [key]: e.target.value })} {...props} />
  )
  const addr = (key, placeholder, className) => (
    <input
      className={`${inputClass} ${className}`}
      placeholder={placeholder}
      value={draft.address[key]}
      onChange={(e) => setAddress({ [key]: e.target.value })}
    />
  )

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:pt-[8vh]">
      <form
        onSubmit={handleSubmit}
        aria-label={contact ? 'Edit contact' : 'New contact'}
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
      >
        <h2 className="border-b border-neutral-200 px-5 py-3 font-semibold">
          {contact ? 'Edit contact' : 'New contact'}
        </h2>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <ErrorBanner>{error}</ErrorBanner>

          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">{text('firstName', { autoFocus: true })}</Field>
            <Field label="Last name">{text('lastName')}</Field>
            <Field label="Company">{text('company')}</Field>
            <Field label="Job title">{text('jobTitle')}</Field>
          </div>

          <MultiValueField
            title="Phone"
            noun="phone"
            items={draft.phones}
            labels={PHONE_LABELS}
            type="tel"
            onChange={(phones) => set({ phones })}
          />
          <MultiValueField
            title="Email"
            noun="email"
            items={draft.emails}
            labels={EMAIL_LABELS}
            type="email"
            onChange={(emails) => set({ emails })}
          />

          <div>
            <p className="mb-1 text-[13px] font-medium text-neutral-700">Address</p>
            <div className="grid grid-cols-6 gap-2">
              {addr('street', 'Street', 'col-span-6')}
              {addr('city', 'City', 'col-span-3')}
              {addr('state', 'State', 'col-span-3')}
              {addr('postalCode', 'Postcode', 'col-span-2')}
              {addr('country', 'Country', 'col-span-4')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Birthday">{text('birthday', { type: 'date' })}</Field>
            <Field label="Tags">{text('tagsText', { placeholder: 'family, work' })}</Field>
          </div>

          <Field label="Notes">
            <textarea
              className={`${inputClass} h-20 resize-y py-1.5`}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>

          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={draft.favorite} onChange={(e) => set({ favorite: e.target.checked })} />
            Favorite
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <Button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
