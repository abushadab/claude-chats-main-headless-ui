"use client"

import Link from "next/link";

export function SkeletonTestNav() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg p-2 space-x-2">
      <Link 
        href="/skeleton-without-ls" 
        className="px-3 py-1 rounded bg-muted hover:bg-accent transition-colors"
      >
        Skeleton (without ls)
      </Link>
      <Link 
        href="/skeleton-with-ls" 
        className="px-3 py-1 rounded bg-muted hover:bg-accent transition-colors"
      >
        Skeleton (with ls)
      </Link>
      <Link 
        href="/project/default/channel/general" 
        className="px-3 py-1 rounded bg-muted hover:bg-accent transition-colors"
      >
        Back to App
      </Link>
    </div>
  );
}