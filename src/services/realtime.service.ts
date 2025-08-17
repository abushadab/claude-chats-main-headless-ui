import { config } from '@/config';
import Cookies from 'js-cookie';

export interface SSEConfig {
  url?: string;
  token?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp?: number;
}

type EventHandler = (data: any) => void;

class RealtimeService {
  private eventSource: EventSource | null = null;
  private config: SSEConfig = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private isIntentionallyClosed = false;
  private lastEventId: string | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private lastPingTime: number = Date.now();

  constructor() {
    // Bind methods to preserve context
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }

  connect(config: SSEConfig = {}): void {
    this.config = {
      url: config.url || 'https://hudhud-api.baytlabs.com/api/realtime/stream',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      ...config,
    };

    this.isIntentionallyClosed = false;
    this.establishConnection();
  }

  private establishConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.updateConnectionStatus('connecting');

    // Get the auth token from localStorage (where auth service stores it)
    const token = this.config.token || localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('[RealtimeService] No authentication token available');
      this.updateConnectionStatus('error');
      return;
    }

    // Build URL with token as query parameter
    const url = new URL(this.config.url!);
    url.searchParams.append('token', token);
    
    // Add last event ID for resuming
    if (this.lastEventId) {
      url.searchParams.append('lastEventId', this.lastEventId);
    }

    console.log('[RealtimeService] Connecting to SSE:', url.origin + url.pathname);

    try {
      this.eventSource = new EventSource(url.toString());
      
      // Set up event handlers
      this.eventSource.onopen = this.handleOpen;
      this.eventSource.onerror = this.handleError;
      this.eventSource.onmessage = this.handleMessage;

      // Set up specific event type listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('[RealtimeService] Failed to create EventSource:', error);
      this.updateConnectionStatus('error');
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Listen for specific event types from backend
    const eventTypes = [
      'init',
      'connection',
      'ping',
      'message',
      'channel_message',
      'broadcast',
      'channel_init',
      'channel_event',
      'presence',
    ];

    eventTypes.forEach(type => {
      this.eventSource!.addEventListener(type, (event: MessageEvent) => {
        this.handleTypedEvent(type, event);
      });
    });
  }

  private handleOpen(event: Event): void {
    console.log('[RealtimeService] SSE connection established');
    this.reconnectAttempts = 0;
    this.updateConnectionStatus('connected');
    
    // Start ping monitoring
    this.startPingMonitoring();
    
    // Notify listeners of connection
    this.emit('connection', { status: 'connected', timestamp: Date.now() });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Store last event ID for resuming
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      }

      // Handle ping to track connection health
      if (data.type === 'ping') {
        this.lastPingTime = Date.now();
        return;
      }

      console.log('[RealtimeService] Received event:', data.type, data);
      
      // Emit to specific listeners
      this.emit(data.type, data.data || data);
      
      // Also emit to general message listeners
      this.emit('message', data);
    } catch (error) {
      console.error('[RealtimeService] Failed to parse message:', error, event.data);
    }
  }

  private handleTypedEvent(type: string, event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Store last event ID
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      }

      console.log(`[RealtimeService] Received ${type} event:`, data);
      
      // Emit the typed event
      this.emit(type, data);
    } catch (error) {
      console.error(`[RealtimeService] Failed to parse ${type} event:`, error);
    }
  }

  private handleError(event: Event): void {
    if (this.eventSource?.readyState === EventSource.CLOSED) {
      console.log('[RealtimeService] SSE connection closed');
      
      if (!this.isIntentionallyClosed) {
        this.updateConnectionStatus('disconnected');
        this.scheduleReconnect();
      }
    } else {
      // SSE errors don't provide much detail, but we can check readyState
      const state = this.eventSource?.readyState;
      const stateText = state === EventSource.CONNECTING ? 'CONNECTING' : 
                        state === EventSource.OPEN ? 'OPEN' : 
                        state === EventSource.CLOSED ? 'CLOSED' : 'UNKNOWN';
      
      console.warn(`[RealtimeService] SSE connection issue (state: ${stateText}). This is normal and will auto-reconnect.`);
      
      if (!this.isIntentionallyClosed && state !== EventSource.CONNECTING) {
        this.updateConnectionStatus('error');
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return;
    
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('[RealtimeService] Max reconnection attempts reached');
      this.updateConnectionStatus('error');
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const baseDelay = this.config.reconnectInterval || 5000;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    const jitter = Math.random() * 1000;
    
    console.log(`[RealtimeService] Reconnecting in ${delay + jitter}ms (attempt ${this.reconnectAttempts})`);
    this.updateConnectionStatus('reconnecting');
    
    this.reconnectTimer = setTimeout(() => {
      this.establishConnection();
    }, delay + jitter);
  }

  private startPingMonitoring(): void {
    this.stopPingMonitoring();
    
    // Update last ping time on start
    this.lastPingTime = Date.now();
    
    // Check for ping every 30 seconds
    this.pingTimer = setInterval(() => {
      const timeSinceLastPing = Date.now() - this.lastPingTime;
      
      // If no ping for 60 seconds, consider connection lost
      if (timeSinceLastPing > 60000) {
        console.warn('[RealtimeService] No ping received for 60 seconds, reconnecting...');
        this.handleError(new Event('ping-timeout'));
      }
    }, 30000);
  }

  private stopPingMonitoring(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    
    if (this.config.onConnectionChange) {
      this.config.onConnectionChange(status);
    }
    
    // Emit connection status change
    this.emit('connectionStatus', { status, timestamp: Date.now() });
  }

  disconnect(): void {
    console.log('[RealtimeService] Disconnecting SSE');
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingMonitoring();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.updateConnectionStatus('disconnected');
    this.listeners.clear();
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  private emit(eventType: string, data: any): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[RealtimeService] Error in ${eventType} handler:`, error);
        }
      });
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Singleton instance
  private static instance: RealtimeService;

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__REALTIME_SERVICE__ = realtimeService;
}