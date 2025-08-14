"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return {
    state: context.collapsed ? 'collapsed' : 'expanded',
    isOpen: context.isOpen,
    setIsOpen: context.setIsOpen,
    collapsed: context.collapsed,
    toggleSidebar: () => context.setCollapsed(!context.collapsed)
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true')
    }
    setIsHydrated(true)
  }, [])

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('sidebar-collapsed', collapsed.toString())
    }
  }, [collapsed, isHydrated])

  // Don't render until hydrated to prevent flash
  if (!isHydrated) {
    return (
      <SidebarContext.Provider value={{ isOpen, setIsOpen, collapsed: false, setCollapsed }}>
        <div className="opacity-0">
          {children}
        </div>
      </SidebarContext.Provider>
    )
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar()
  
  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "p-2 hover:bg-accent rounded-md transition-colors",
        className
      )}
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

interface SidebarProps {
  children: ReactNode
  className?: string
  collapsible?: 'icon' | 'none'
}

export function Sidebar({ children, className, collapsible = 'none' }: SidebarProps) {
  const { collapsed } = useSidebar()
  
  return (
    <aside
      className={cn(
        "border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed && collapsible === 'icon' ? "w-14" : "w-64",
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

interface SidebarMenuButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function SidebarMenuButton({ children, className, onClick }: SidebarMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors",
        className
      )}
    >
      {children}
    </button>
  )
}