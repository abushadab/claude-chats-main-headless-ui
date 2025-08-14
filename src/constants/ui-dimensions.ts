// Shared UI dimensions to ensure consistency between components and skeletons

export const UI_DIMENSIONS = {
  sidebar: {
    width: 'w-14', // 56px (fixed width)
    logoSize: 40,
    projectIcon: 'w-8 h-8',
  },
  channels: {
    itemHeight: 'h-8', // 32px
    iconSize: 'h-3 w-3', // 12px
    sidebarWidth: 'w-72',
    headerHeight: 'h-[60px]',
  },
  topbar: {
    height: 'h-14',
    toggleButton: 'h-5 w-5', // 20px
    userProfile: 'w-[140px]',
  },
  chat: {
    headerHeight: 'h-14',
  }
} as const;

// Example usage:
// import { UI_DIMENSIONS } from '@/constants/ui-dimensions';
// className={UI_DIMENSIONS.channels.itemHeight}