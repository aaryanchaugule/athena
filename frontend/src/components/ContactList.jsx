import { Star } from 'lucide-react'
import { displayName } from '../store/contacts'

function groupKey(contact) {
  const first = displayName(contact).trim()[0]?.toUpperCase() ?? '#'
  return /[A-Z]/.test(first) ? first : '#'
}

export default function ContactList({ contacts, selectedId, onSelect, emptyMessage }) {
  if (contacts.length === 0) {
    return <p className="px-4 py-8 text-center text-[13px] text-neutral-500">{emptyMessage}</p>
  }

  const groups = []
  for (const contact of contacts) {
    const key = groupKey(contact)
    if (groups.at(-1)?.key !== key) groups.push({ key, items: [] })
    groups.at(-1).items.push(contact)
  }

  return (
    <div className="pb-4">
      {groups.map(({ key, items }) => (
        <section key={key}>
          <h3 className="sticky top-0 border-b border-neutral-100 bg-white px-4 pt-3 pb-1 text-xs font-semibold text-neutral-500">
            {key}
          </h3>
          <ul>
            {items.map((contact) => {
              const selected = contact.id === selectedId
              return (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(contact.id)}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left ${
                      selected ? 'bg-blue-600 text-white' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{displayName(contact)}</p>
                      {contact.company && displayName(contact) !== contact.company && (
                        <p className={`truncate text-xs ${selected ? 'text-blue-100' : 'text-neutral-500'}`}>
                          {contact.company}
                        </p>
                      )}
                    </div>
                    {contact.favorite && (
                      <Star className={`size-3 ${selected ? 'fill-white text-white' : 'fill-neutral-400 text-neutral-400'}`} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
