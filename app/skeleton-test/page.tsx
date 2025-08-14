"use client"

import { useState } from "react";
import { AuthLoadingSkeleton } from "@/components/ui/skeleton-components";
import { AuthLoadingSkeletonV2 } from "@/components/ui/skeleton-components-v2";

export default function SkeletonTestPage() {
  const [version, setVersion] = useState<"without-ls" | "with-ls">("with-ls");

  return (
    <div>
      {/* Version switcher */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg p-2 space-x-2">
        <button
          className={`px-3 py-1 rounded ${version === "without-ls" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setVersion("without-ls")}
        >
          Skeleton (without ls)
        </button>
        <button
          className={`px-3 py-1 rounded ${version === "with-ls" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setVersion("with-ls")}
        >
          Skeleton (with ls)
        </button>
      </div>
      
      {/* Show selected version */}
      {version === "without-ls" ? <AuthLoadingSkeleton /> : <AuthLoadingSkeletonV2 />}
    </div>
  );
}