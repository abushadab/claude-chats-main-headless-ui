/**
 * Developer logging utility with toggle functionality
 * Logs are only shown when console logging is enabled in dev tools
 */

class Logger {
  private enabled: boolean = false;
  private categories: Set<string> = new Set(['all']);

  constructor() {
    // Load settings from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('console_logs_enabled') === 'true';
      const savedCategories = localStorage.getItem('console_log_categories');
      if (savedCategories) {
        try {
          this.categories = new Set(JSON.parse(savedCategories));
        } catch (e) {
          this.categories = new Set(['all']);
        }
      }
    }
  }

  /**
   * Enable or disable console logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('console_logs_enabled', String(enabled));
    }
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set which categories to log
   */
  setCategories(categories: string[]) {
    this.categories = new Set(categories);
    if (typeof window !== 'undefined') {
      localStorage.setItem('console_log_categories', JSON.stringify(categories));
    }
  }

  /**
   * Get current log categories
   */
  getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Check if a category is enabled
   */
  isCategoryEnabled(category: string): boolean {
    return this.categories.has('all') || this.categories.has(category);
  }

  /**
   * Log a message if logging is enabled
   */
  log(category: string, message: string, ...args: any[]) {
    if (this.enabled && this.isCategoryEnabled(category)) {
      console.log(`[${category}] ${message}`, ...args);
    }
  }

  /**
   * Log an error (always shown regardless of settings)
   */
  error(category: string, message: string, ...args: any[]) {
    console.error(`[${category}] ${message}`, ...args);
  }

  /**
   * Log a warning if logging is enabled
   */
  warn(category: string, message: string, ...args: any[]) {
    if (this.enabled && this.isCategoryEnabled(category)) {
      console.warn(`[${category}] ${message}`, ...args);
    }
  }

  /**
   * Log info if logging is enabled
   */
  info(category: string, message: string, ...args: any[]) {
    if (this.enabled && this.isCategoryEnabled(category)) {
      console.info(`[${category}] ${message}`, ...args);
    }
  }

  /**
   * Log debug info if logging is enabled
   */
  debug(category: string, message: string, ...args: any[]) {
    if (this.enabled && this.isCategoryEnabled(category)) {
      console.debug(`[${category}] ${message}`, ...args);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Add to window for easy console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
  (window as any).enableLogs = () => {
    logger.setEnabled(true);
    logger.setCategories(['all']);
    console.log('✅ Console logs enabled (all categories)');
  };
  (window as any).disableLogs = () => {
    logger.setEnabled(false);
    console.log('❌ Console logs disabled');
  };
  console.log('💡 Tip: Use window.enableLogs() or window.disableLogs() to toggle logging');
}

// Export log categories for easy reference
export const LogCategories = {
  WEBSOCKET: 'websocket',
  API: 'api',
  CACHE: 'cache',
  AUTH: 'auth',
  ROUTER: 'router',
  COMPONENT: 'component',
  SERVICE: 'service',
  HOOK: 'hook',
  REALTIME: 'realtime',
} as const;

export type LogCategory = typeof LogCategories[keyof typeof LogCategories];