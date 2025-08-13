import { Skeleton } from "@/components/ui/skeleton";

interface ProjectItemProps {
  name?: string;
  initials?: string;
  color?: string;
  isSelected?: boolean;
  hasUnread?: boolean;
  unreadCount?: number;
  collapsed?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

export function ProjectItem({ 
  name, 
  initials, 
  color = 'bg-gray-500',
  isSelected,
  hasUnread,
  unreadCount,
  collapsed,
  isLoading,
  onClick 
}: ProjectItemProps) {
  if (isLoading) {
    return (
      <div className={collapsed 
        ? "w-10 h-10 p-0 flex items-center justify-center mx-auto"
        : "w-full h-10 px-2 flex items-center"
      }>
        {collapsed ? (
          <Skeleton className="w-8 h-8 rounded-lg" />
        ) : (
          <div className="flex items-center w-full">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <Skeleton className="ml-3 h-4 w-24" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className={collapsed 
        ? `w-10 h-10 p-0 flex items-center justify-center mx-auto rounded-lg transition-colors hover:bg-transparent relative`
        : `w-full h-10 justify-start px-2 hover:bg-transparent relative ${
            isSelected ? 'bg-primary/20' : ''
          }`
      }
      onClick={onClick}
    >
      {collapsed ? (
        <>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${color} ${
            isSelected 
              ? `ring-2 ring-offset-2 ring-offset-background` 
              : `opacity-60`
          }`}>
            <span className="text-sm font-bold text-white">
              {initials}
            </span>
          </div>
          {hasUnread && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
          )}
        </>
      ) : (
        <div className="flex items-center w-full">
          <div className={`w-8 h-8 ${color} text-white rounded-lg text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
            {initials}
          </div>
          <span className="ml-3 truncate flex-1 text-left">{name}</span>
          {hasUnread && unreadCount && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}