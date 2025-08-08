"use client"

export function EmptyChannelState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">
          Select a channel to start chatting
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Choose a project and channel from the sidebar to view messages
        </p>
      </div>
    </div>
  );
}