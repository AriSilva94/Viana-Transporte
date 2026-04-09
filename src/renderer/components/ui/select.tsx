import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronDown, Search, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@renderer/lib/utils'

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
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
  ({ className, children, value, onChange, disabled = false, id }, ref) => {
    const { t } = useTranslation('common')
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const dropdownRef = React.useRef<HTMLDivElement | null>(null)
    const searchRef = React.useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [dropdownPos, setDropdownPos] = React.useState<{
      top: number
      left: number
      width: number
    } | null>(null)

    const options = extractOptions(children)
    const selectedOption = options.find((o) => o.value === String(value ?? ''))
    const filteredOptions = search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options

    function openDropdown(): void {
      const btn = buttonRef.current
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
      }
      setSearch('')
      setOpen(true)
    }

    function handleSelect(optionValue: string): void {
      onChange?.({ target: { value: optionValue } } as React.ChangeEvent<HTMLSelectElement>)
      setOpen(false)
    }

    React.useEffect(() => {
      if (open && searchRef.current) {
        searchRef.current.focus()
      }
    }, [open])

    React.useEffect(() => {
      function handleOutsideClick(event: MouseEvent): void {
        const target = event.target as Node
        const insideButton = buttonRef.current?.contains(target)
        const insideDropdown = dropdownRef.current?.contains(target)
        if (!insideButton && !insideDropdown) {
          setOpen(false)
        }
      }
      if (open) {
        document.addEventListener('mousedown', handleOutsideClick)
      }
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick)
      }
    }, [open])

    return (
      <div className={cn('relative w-full', className)}>
        <button
          id={id}
          ref={(node) => {
            buttonRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          type="button"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openDropdown())}
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

        {open && dropdownPos
          ? ReactDOM.createPortal(
              <div
                ref={dropdownRef}
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  position: 'fixed',
                }}
                className="z-[9999] overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(34,49,95,0.14)]"
              >
                <div className="border-b border-border p-2">
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-white/85 px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('search')}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
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
              </div>,
              document.body
            )
          : null}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
