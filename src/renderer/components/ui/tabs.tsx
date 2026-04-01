import * as React from 'react'
import { cn } from '@renderer/lib/utils'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs(): TabsContextValue {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('useTabs must be used inside <Tabs>')
  return ctx
}

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

function Tabs({ defaultValue, children, className }: TabsProps): JSX.Element {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): JSX.Element {
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-white/75 p-2 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

function TabsTrigger({ value, children, className }: TabsTriggerProps): JSX.Element {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value
  return (
    <button
      type="button"
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-brand-deep text-white shadow-sm'
          : 'text-muted-foreground hover:bg-brand-sand/20 hover:text-foreground',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

function TabsContent({ value, children, className }: TabsContentProps): JSX.Element | null {
  const { activeTab } = useTabs()
  if (activeTab !== value) return null
  return <div className={cn('mt-2', className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
