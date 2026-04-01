import { useToastContext } from '@renderer/context/ToastContext'

export function ToastContainer(): JSX.Element {
  const { toasts } = useToastContext()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-md text-sm font-medium text-foreground"
        >
          <span className={toast.type === 'success' ? 'text-success' : 'text-destructive'}>
            ●
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
