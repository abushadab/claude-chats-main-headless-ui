import { ReactNode } from "react";

interface SidebarLayoutProps {
  collapsed?: boolean;
  logo: ReactNode;
  projects: ReactNode;
  settings: ReactNode;
}

export function SidebarLayout({ collapsed, logo, projects, settings }: SidebarLayoutProps) {
  return (
    <div className={`${collapsed ? 'w-14' : 'w-64'} bg-muted border-r border-border flex-shrink-0 flex flex-col transition-all duration-300`}>
      {/* Fixed Header Section */}
      <div className={`h-14 flex items-center bg-sidebar flex-shrink-0 overflow-hidden ${
        collapsed ? 'px-2 justify-center' : 'px-3 justify-start'
      }`}>
        {logo}
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {projects}
      </div>
      
      {/* Bottom Bar with Settings */}
      <div className={`h-14 bg-sidebar flex items-center flex-shrink-0 ${
        collapsed ? 'px-2 justify-center' : 'px-3'
      }`}>
        {settings}
      </div>
    </div>
  );
}