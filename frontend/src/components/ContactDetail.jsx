import { useState } from 'react'
import { ChevronLeft, Star } from 'lucide-react'
import { displayName, initials } from '../store/contacts'
import { Avatar, Button } from './ui'

function Row({ label, children }) {
  return (
    <>
      <dt className="pt-px text-right text-[13px] text-neutral-500 capitalize">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  )
}

function formatBirthday(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ContactDetail({ contact, onEdit, onDelete, onToggleFavorite, onBack }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const a = contact.address
  const address = [a.street, [a.city, a.state, a.postalCode].filter(Boolean).join(', '), a.country].filter(Boolean)
  const subtitle = [contact.jobTitle, contact.company].filter(Boolean).join(', ')
  const link = 'text-blue-600 hover:underline'

  async function handleDelete() {
    setBusy(true)
    try {
      await onDelete()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-6">
      <button type="button" onClick={onBack} className="mb-4 flex items-center text-[13px] text-blue-600 md:hidden">
        <ChevronLeft className="size-4" /> Contacts
      </button>

      <div className="flex items-center gap-4">
        <Avatar text={initials(contact)} size="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold">{displayName(contact)}</h2>
          {subtitle && <p className="truncate text-neutral-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          title={contact.favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <Star className={`size-4 ${contact.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
        <Button onClick={onEdit}>Edit</Button>
      </div>

      <dl className="mt-6 grid grid-cols-[88px_1fr] gap-x-4 gap-y-2.5 border-t border-neutral-200 pt-5">
        {contact.phones.map((p, i) => (
          <Row key={`p${i}`} label={p.label}>
            <a href={`tel:${p.value}`} className={link}>
              {p.value}
            </a>
          </Row>
        ))}
        {contact.emails.map((e, i) => (
          <Row key={`e${i}`} label={e.label}>
            <a href={`mailto:${e.value}`} className={link}>
              {e.value}
            </a>
          </Row>
        ))}
        {address.length > 0 && (
          <Row label="address">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </Row>
        )}
        {contact.birthday && <Row label="birthday">{formatBirthday(contact.birthday)}</Row>}
        {contact.tags.length > 0 && <Row label="tags">{contact.tags.join(', ')}</Row>}
        {contact.notes && (
          <Row label="notes">
            <span className="whitespace-pre-wrap">{contact.notes}</span>
          </Row>
        )}
      </dl>

      <div className="mt-8 border-t border-neutral-200 pt-4">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="mr-1">Delete this contact?</span>
            <Button size="sm" variant="danger" busy={busy} onClick={handleDelete}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="text-[13px] text-red-600 hover:underline">
            Delete contact
          </button>
        )}
      </div>
    </div>
  )
}
