import { useEffect, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useVault } from '../store/vaultContext'
import { compareContacts, matchesQuery } from '../store/contacts'
import ContactDetail from './ContactDetail'
import ContactForm from './ContactForm'
import ContactList from './ContactList'
import Sidebar from './Sidebar'
import { Button, ErrorBanner } from './ui'

const isTyping = (el) => el?.closest('input, textarea, select, [contenteditable="true"]')

export default function Vault() {
  const { user, contacts, lock, logout, saveContact, deleteContact, toggleFavorite } = useVault()
  const [query, setQuery] = useState('')
  const [view, setView] = useState({ type: 'all' })
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | contact
  const [error, setError] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (editing || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const tagCounts = new Map()
  for (const c of contacts) for (const t of c.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  const tags = [...tagCounts].sort(([a], [b]) => a.localeCompare(b))

  const inView = (c) =>
    view.type === 'favorites' ? c.favorite : view.type === 'tag' ? c.tags.includes(view.tag) : true
  const visible = contacts.filter((c) => inView(c) && matchesQuery(c, query)).sort(compareContacts)
  const selected = contacts.find((c) => c.id === selectedId) ?? null

  let emptyMessage = 'No contacts yet.'
  if (query) emptyMessage = 'No results.'
  else if (contacts.length) emptyMessage = 'Nothing here.'

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSave(contact) {
    const id = await saveContact(contact)
    setEditing(null)
    setSelectedId(id)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        view={view}
        onView={(v) => {
          setView(v)
          setSelectedId(null)
        }}
        contacts={contacts}
        tags={tags}
        user={user}
        onLock={lock}
        onLogout={logout}
      />

      <section
        className={`w-full shrink-0 flex-col border-r border-neutral-200 md:w-72 ${selected ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 text-[13px] lg:hidden">
          <span className="font-semibold">Athena</span>
          <div className="flex gap-3">
            <button type="button" onClick={lock} className="text-neutral-700 hover:underline">
              Lock
            </button>
            <button type="button" onClick={logout} className="text-neutral-700 hover:underline">
              Sign out
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-neutral-200 p-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block h-8 w-full rounded-md bg-neutral-100 pr-2 pl-7 text-sm placeholder:text-neutral-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
            />
          </div>
          <Button size="icon" onClick={() => setEditing('new')} title="New contact" aria-label="New contact">
            <Plus className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="p-2.5">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ContactList contacts={visible} selectedId={selectedId} onSelect={setSelectedId} emptyMessage={emptyMessage} />
        </div>

        <p className="border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
          {visible.length} {visible.length === 1 ? 'contact' : 'contacts'}
        </p>
      </section>

      <main className={`min-w-0 flex-1 overflow-y-auto ${selected ? 'block' : 'hidden md:block'}`}>
        {selected ? (
          <ContactDetail
            key={selected.id}
            contact={selected}
            onBack={() => setSelectedId(null)}
            onEdit={() => setEditing(selected)}
            onToggleFavorite={() => run(() => toggleFavorite(selected.id))}
            onDelete={() =>
              run(async () => {
                await deleteContact(selected.id)
                setSelectedId(null)
              })
            }
          />
        ) : (
          <p className="flex h-full items-center justify-center text-[13px] text-neutral-400">No contact selected</p>
        )}
      </main>

      {editing && (
        <ContactForm
          contact={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
