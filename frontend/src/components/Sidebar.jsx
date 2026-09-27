function Item({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-full items-center rounded px-2 text-left text-[13px] ${
        active ? 'bg-neutral-200/70 font-medium text-neutral-900' : 'text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      <span className="flex-1 truncate">{label}</span>
      <span className="text-xs text-neutral-400">{count}</span>
    </button>
  )
}

export default function Sidebar({ view, onView, contacts, tags, user, onLock, onLogout }) {
  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 lg:flex">
      <p className="px-4 pt-4 pb-4 text-[15px] font-semibold tracking-tight">Athena</p>

      <nav className="flex-1 overflow-y-auto px-2">
        <Item label="All contacts" count={contacts.length} active={view.type === 'all'} onClick={() => onView({ type: 'all' })} />
        <Item
          label="Favorites"
          count={contacts.filter((c) => c.favorite).length}
          active={view.type === 'favorites'}
          onClick={() => onView({ type: 'favorites' })}
        />
        {tags.length > 0 && (
          <>
            <p className="mt-5 mb-1 px-2 text-xs font-medium text-neutral-500">Tags</p>
            {tags.map(([tag, count]) => (
              <Item
                key={tag}
                label={tag}
                count={count}
                active={view.type === 'tag' && view.tag === tag}
                onClick={() => onView({ type: 'tag', tag })}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-neutral-200 px-4 py-3 text-[13px]">
        <p className="truncate text-neutral-500" title={user?.email}>
          {user?.email}
        </p>
        <div className="mt-1.5 flex gap-3">
          <button type="button" onClick={onLock} className="text-neutral-700 hover:underline">
            Lock
          </button>
          <button type="button" onClick={onLogout} className="text-neutral-700 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
