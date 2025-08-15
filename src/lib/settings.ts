/**
 * Settings utilities for localStorage persistence
 */

interface AppSettings {
  showLoadingScreen: boolean;
  projectsCacheEnabled: boolean;
  channelsCacheEnabled: boolean;
  workspaceCacheEnabled: boolean;
}

export const getAppSettings = (): AppSettings => {
  const defaults: AppSettings = {
    showLoadingScreen: true,
    projectsCacheEnabled: false,
    channelsCacheEnabled: false,
    workspaceCacheEnabled: false,
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const savedShowLoadingScreen = localStorage.getItem('show_loading_screen');
    const savedProjectsCache = localStorage.getItem('projects_cache_enabled');
    const savedChannelsCache = localStorage.getItem('channels_cache_enabled');
    const savedWorkspaceCache = localStorage.getItem('workspace_cache_enabled');
    
    return {
      showLoadingScreen: savedShowLoadingScreen !== null ? savedShowLoadingScreen === 'true' : defaults.showLoadingScreen,
      projectsCacheEnabled: savedProjectsCache !== null ? savedProjectsCache === 'true' : defaults.projectsCacheEnabled,
      channelsCacheEnabled: savedChannelsCache !== null ? savedChannelsCache === 'true' : defaults.channelsCacheEnabled,
      workspaceCacheEnabled: savedWorkspaceCache !== null ? savedWorkspaceCache === 'true' : defaults.workspaceCacheEnabled,
    };
  } catch (error) {
    console.warn('Failed to load app settings:', error);
    return defaults;
  }
};

export const shouldShowLoadingScreen = (): boolean => {
  return getAppSettings().showLoadingScreen;
};