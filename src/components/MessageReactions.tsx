"use client"

import { useState } from "react"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MessageReaction {
  emoji: string
  users: Array<{
    id: string
    name: string
  }>
  count: number
}

interface MessageReactionsProps {
  messageId: string
  reactions: MessageReaction[]
  currentUserId: string
  onReact: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
}

const popularEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🚀", "👏", "🔥"]

export function MessageReactions({ 
  messageId, 
  reactions, 
  currentUserId = "current-user", 
  onReact, 
  onRemoveReaction 
}: MessageReactionsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleReactionClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji)
    const userHasReacted = existingReaction?.users.some(u => u.id === currentUserId)

    if (userHasReacted) {
      onRemoveReaction(messageId, emoji)
    } else {
      onReact(messageId, emoji)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    handleReactionClick(emoji)
    setIsPickerOpen(false)
  }

  if (reactions.length === 0 && !isPickerOpen) {
    return (
      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover className="relative inline-block">
          <PopoverButton
            className="inline-flex items-center px-2 py-1 text-xs bg-muted hover:bg-accent rounded-full transition-colors"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            React
          </PopoverButton>
          
          <PopoverPanel className="absolute bottom-full left-0 mb-2 bg-background border border-border rounded-lg shadow-lg p-2 z-10">
            <div className="grid grid-cols-5 gap-1">
              {popularEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-2 text-lg hover:bg-accent rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverPanel>
        </Popover>
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => {
        const userHasReacted = reaction.users.some(u => u.id === currentUserId)
        const userNames = reaction.users.map(u => u.name).join(", ")
        
        return (
          <button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction.emoji)}
            className={cn(
              "inline-flex items-center px-2 py-1 text-xs rounded-full border transition-all hover:scale-105",
              userHasReacted
                ? "hover:bg-accent/80  border-primary text-primary"
                : "bg-muted border-border hover:bg-accent"
            )}
            title={`${reaction.emoji} ${userNames}`}
          >
            <span className="mr-1">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>
        )
      })}
      
      {/* Add Reaction Button */}
      <Popover className="relative inline-block">
        <PopoverButton className="inline-flex items-center px-2 py-1 text-xs bg-muted hover:bg-accent border border-border rounded-full transition-colors">
          <Plus className="h-3 w-3" />
        </PopoverButton>
        
        <PopoverPanel className="absolute bottom-full left-0 mb-2 bg-background border border-border rounded-lg shadow-lg p-2 z-10">
          <div className="grid grid-cols-5 gap-1">
            {popularEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="p-2 text-lg hover:bg-accent rounded transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  )
}