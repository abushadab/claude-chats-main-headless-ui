"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import { motivationalQuotes } from "@/components/ChatArea/mockData";

export function LoadingScreen() {
  const [randomQuote, setRandomQuote] = useState<{ quote: string; author: string } | null>(null);
  
  useEffect(() => {
    // Pick a random quote on mount
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setRandomQuote(motivationalQuotes[randomIndex]);
  }, []);

  if (!randomQuote) {
    // Fallback while quote is being selected
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background px-8">
      {/* Logo and Brand */}
      <div className="flex flex-col items-center mb-12">
        <Image 
          src="/hudhud-logo.svg" 
          alt="Hudhud" 
          width={80}
          height={80}
          className="rounded-[12px] mb-4"
        />
        <h1 className="text-3xl font-bold text-foreground">Hudhud</h1>
        <p className="text-sm text-muted-foreground mt-2">Connecting teams, building communities</p>
      </div>
      
      {/* Loading Spinner */}
      <div className="mb-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
      
      {/* Quote */}
      <div className="max-w-2xl text-center space-y-4">
        <blockquote className="text-lg italic text-muted-foreground">
          &ldquo;{randomQuote.quote}&rdquo;
        </blockquote>
        <cite className="block text-sm font-medium text-primary">
          — {randomQuote.author}
        </cite>
      </div>
      
      {/* Loading text */}
      <p className="text-sm text-muted-foreground mt-8 animate-pulse">
        Loading your workspace...
      </p>
    </div>
  );
}