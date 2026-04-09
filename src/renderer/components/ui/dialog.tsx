import * as React from 'react'
import { cn } from '@renderer/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps): JSX.Element | null {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-brand-deep/45 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg rounded-3xl border border-border/70 bg-white/95 p-6 shadow-[0_24px_60px_rgba(34,49,95,0.24)]">
        {children}
      </div>
    </div>
  )
}

function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)}>{children}</div>
  )
}

function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): JSX.Element {
  return (
    <h2 className={cn('text-lg font-semibold leading-none', className)}>{children}</h2>
  )
}

function DialogDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): JSX.Element {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  )
}

function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={cn('flex justify-end gap-2 pt-4', className)}>{children}</div>
  )
}

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
