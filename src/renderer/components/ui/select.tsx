import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, Search, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'

export interface SelectProps {
  children: React.ReactNode
  className?: string
  'data-testid'?: string
  disabled?: boolean
  id?: string
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  value?: string | number
}

interface SelectOption {
  value: string
  label: string
}

function extractOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const optionEl = child as React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>
      const value = String(optionEl.props.value ?? '')
      const label = String(optionEl.props.children ?? '')
      options.push({ value, label })
    }
  })
  return options
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    { className, children, value, onChange, disabled = false, id, 'data-testid': dataTestId },
    ref
  ) => {
    const { t } = useTranslation('common')
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const options = extractOptions(children)
    const selectedOption = options.find((o) => o.value === String(value ?? ''))
    const filteredOptions = search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options

    function handleSelect(optionValue: string): void {
      onChange?.({ target: { value: optionValue } } as React.ChangeEvent<HTMLSelectElement>)
      setOpen(false)
    }

    return (
      <Popover.Root
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) setSearch('')
        }}
      >
        <div className={cn('relative w-full', className)}>
          <Popover.Trigger asChild>
            <button
              id={id}
              data-testid={dataTestId}
              ref={ref}
              type="button"
              disabled={disabled}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-xl border border-input bg-white/85 px-3 py-2 text-left text-sm shadow-sm transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selectedOption ? 'text-foreground' : 'text-muted-foreground',
                open && 'border-secondary/45 ring-2 ring-brand-sky/18'
              )}
            >
              <span className="truncate">{selectedOption?.label ?? ''}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              collisionPadding={8}
              hideWhenDetached
              role="listbox"
              className="z-[9999] flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(34,49,95,0.14)]"
            >
              <div className="shrink-0 border-b border-border p-2">
                <div className="flex items-center gap-2 rounded-lg border border-input bg-white/85 px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('search')}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="min-h-0 max-h-60 overflow-y-auto overscroll-contain py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t('noResults')}</div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = option.value === String(value ?? '')
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        data-testid={`select-option-${option.value}`}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                          isSelected
                            ? 'bg-brand-deep/8 font-medium text-brand-deep'
                            : 'text-foreground hover:bg-brand-sand/15'
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-deep" />}
                      </button>
                    )
                  })
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </div>
      </Popover.Root>
    )
  }
)

Select.displayName = 'Select'

export { Select }
