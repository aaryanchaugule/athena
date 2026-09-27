const BUTTON_VARIANTS = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-700',
  secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  danger: 'border border-neutral-300 bg-white text-red-600 hover:bg-red-50',
}

const BUTTON_SIZES = {
  sm: 'h-7 px-2.5 text-[13px]',
  md: 'h-8 px-3 text-sm',
  icon: 'size-8',
}

export function Button({ variant = 'secondary', size = 'md', className = '', busy, children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {children}
    </button>
  )
}

export const inputClass =
  'block h-8 w-full rounded-md border border-neutral-300 bg-white px-2.5 text-sm placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none'

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[13px] font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  )
}

export function ErrorBanner({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
      {children}
    </p>
  )
}

export function Avatar({ text, size = 'size-8 text-xs' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-600 ${size}`}
    >
      {text}
    </div>
  )
}
