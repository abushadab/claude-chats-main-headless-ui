"use client"

import { createContext, useContext, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return {
    isOpen: context.isOpen,
    setIsOpen: context.setIsOpen,
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Sidebar is always visible in our new design
  const isOpen = true
  const setIsOpen = () => {}

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// SidebarTrigger removed - no longer needed without expand/collapse

interface SidebarProps {
  children: ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  // Sidebar is always 56px wide
  return (
    <aside
      className={cn(
        "w-14 border-r border-border bg-sidebar",
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col h-full", className)}>{children}</div>
}

export function SidebarGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-1 py-1", className)}>{children}</div>
}

export function SidebarGroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-sm font-medium text-muted-foreground px-2 py-1.5", className)}>{children}</div>
}

export function SidebarGroupContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-1", className)}>{children}</div>
}

export function SidebarMenu({ children, className }: { children: ReactNode; className?: string }) {
  return <nav className={cn("space-y-1", className)}>{children}</nav>
}

export function SidebarMenuItem({ children, className }: { children: ReactNode; className?: string }) {
  return className ? <div className={className}>{children}</div> : <div>{children}</div>
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SidebarMenuButton.displayName = 'SidebarMenuButton'