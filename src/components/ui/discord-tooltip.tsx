"use client"

import * as React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

interface DiscordTooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function DiscordTooltip({ 
  children, 
  content, 
  side = "right",
  align = "center" 
}: DiscordTooltipProps) {
  return (
    <HoverCard openDelay={100} closeDelay={0}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={12}
        className={cn(
          "w-auto p-2 px-3",
          "bg-gray-900 text-white text-sm font-medium",
          "border-0 shadow-lg rounded-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "z-[100]"
        )}
      >
        {content}
      </HoverCardContent>
    </HoverCard>
  )
}