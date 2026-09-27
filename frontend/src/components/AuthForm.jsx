export default function AuthForm({ title, onSubmit, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-neutral-50 px-4 pt-[12vh] pb-10">
      <p className="mb-6 text-base font-semibold tracking-tight">Athena</p>
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="mb-5 text-lg font-semibold">{title}</h1>
        <div className="space-y-4">{children}</div>
      </form>
      {footer && <div className="mt-4 text-[13px] text-neutral-600">{footer}</div>}
      <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-neutral-500">
        Contacts are encrypted in your browser before they’re uploaded. The server can’t read them and can’t
        reset your password.
      </p>
    </div>
  )
}
