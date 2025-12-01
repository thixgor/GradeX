import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface CollapsibleContentProps {
  children: React.ReactNode
}

const Collapsible = React.forwardRef<
  HTMLDivElement,
  CollapsibleProps
>(({ open = false, onOpenChange, children }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open)

  React.useEffect(() => {
    setIsOpen(open)
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <div ref={ref} data-state={isOpen ? "open" : "closed"}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            onOpenChange: handleOpenChange,
          })
        }
        return child
      })}
    </div>
  )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps & { isOpen?: boolean; onOpenChange?: (open: boolean) => void }
>(({ isOpen, onOpenChange, ...props }, ref) => (
  <button
    ref={ref}
    onClick={() => onOpenChange?.(!isOpen)}
    data-state={isOpen ? "open" : "closed"}
    {...props}
  />
))
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps & { isOpen?: boolean }
>(({ isOpen, children }, ref) => (
  <div
    ref={ref}
    hidden={!isOpen}
    data-state={isOpen ? "open" : "closed"}
  >
    {children}
  </div>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
