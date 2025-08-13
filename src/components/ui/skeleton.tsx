import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted-foreground/20",
        "relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-background/40 before:to-transparent",
        className
      )}
      style={{
        '--shimmer-duration': '2s',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Skeleton }
