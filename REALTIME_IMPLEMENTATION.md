# Real-Time Messaging Implementation Guide

## Overview
This document outlines the implementation of real-time messaging features using Server-Sent Events (SSE) for the Hudhud chat application.

## Backend Infrastructure (Already Available)
The backend provides a comprehensive SSE-based real-time system with the following endpoints:

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `GET /api/realtime/stream` | Main SSE stream for all user channels | JWT Required |
| `GET /api/realtime/stream/channel/:channelId` | Channel-specific SSE stream | JWT Required |
| `GET /api/realtime/status` | Connection status & stats | Optional |

## Event Types from Backend

```typescript
// Connection Events
{ type: 'init', data: { userId, username, channels, timestamp } }
{ type: 'connection', data: { status: 'connected', userId, timestamp } }
{ type: 'ping', data: { timestamp } }

// Message Events
{ type: 'message', data: { ...messageData } }
{ type: 'channel_message', data: { ...messageData, channelId } }
{ type: 'broadcast', data: { ...broadcastData } }

// Channel Events
{ type: 'channel_init', data: { channel, members, timestamp } }
{ type: 'channel_event', data: { ...channelCRUD } }

// Presence Events
{ type: 'presence', data: { ...presenceUpdate } }
```

## Implementation Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend Architecture                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │            RealtimeContext (Global)              │    │
│  │  - Manages SSE connection lifecycle              │    │
│  │  - Distributes events to subscribers             │    │
│  │  - Tracks connection status                      │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                    │
│         ┌───────────┴────────────┬────────────┐         │
│         ▼                        ▼            ▼         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   ChatArea   │  │    TopBar    │  │   Members    │ │
│  │              │  │              │  │   Sidebar    │ │
│  │ - Messages   │  │ - Online     │  │              │ │
│  │ - Typing     │  │   count      │  │ - Presence   │ │
│  │   indicators │  │ - Notifs     │  │   status     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Core SSE Infrastructure

### 1.1 Create SSE Service (`src/services/realtime.service.ts`)

```typescript
interface SSEConfig {
  url: string;
  token: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class RealtimeService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<Function>> = new Map();
  
  connect(config: SSEConfig): void {
    // Implementation details
  }
  
  disconnect(): void {
    // Clean up connection
  }
  
  on(eventType: string, callback: Function): void {
    // Register event listener
  }
  
  off(eventType: string, callback: Function): void {
    // Remove event listener
  }
}
```

### 1.2 Create Realtime Context (`src/contexts/RealtimeContext.tsx`)

```typescript
interface RealtimeContextValue {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onlineUsers: Map<string, UserPresence>;
  subscribe: (eventType: string, handler: Function) => void;
  unsubscribe: (eventType: string, handler: Function) => void;
}
```

## Phase 2: Message Real-time Updates

### 2.1 Create useRealtimeMessages Hook (`src/hooks/useRealtimeMessages.ts`)

```typescript
function useRealtimeMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { subscribe, unsubscribe } = useRealtime();
  
  useEffect(() => {
    const handleMessage = (data: any) => {
      // Handle new messages
      // Handle message edits
      // Handle message deletions
    };
    
    subscribe('channel_message', handleMessage);
    return () => unsubscribe('channel_message', handleMessage);
  }, [channelId]);
  
  return { messages };
}
```

### 2.2 Integration Points in ChatArea

- Replace polling with SSE subscription
- Handle optimistic updates
- Manage message deduplication
- Update cache on real-time events

## Phase 3: Presence & Online Status

### 3.1 Presence Tracking Implementation

```typescript
interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentChannel?: string;
}
```

### 3.2 Update Components
- **TopBar**: Show real-time online count
- **MembersSidebar**: Add online indicators
- **MessageList**: Show user typing indicators

## Phase 4: Channel Updates

### 4.1 Handle Channel Events
- Channel creation/deletion
- Member additions/removals
- Channel settings updates
- Auto-navigation on channel changes

## Phase 5: Error Handling & Recovery

### 5.1 Connection Recovery Strategy
```typescript
class ConnectionRecovery {
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  
  async attemptReconnect() {
    // Exponential backoff
    // Token refresh on 401
    // Fallback mechanisms
  }
}
```

### 5.2 User Feedback
- Connection status indicators
- Offline mode detection
- Sync status for messages
- Error toast notifications

## Implementation Checklist

### Core Infrastructure
- [ ] Create `realtime.service.ts`
- [ ] Create `RealtimeContext.tsx`
- [ ] Add authentication token handling
- [ ] Implement auto-reconnection logic

### Message Features
- [ ] Create `useRealtimeMessages` hook
- [ ] Update ChatArea component
- [ ] Handle message CRUD events
- [ ] Implement message deduplication

### Presence Features
- [ ] Create `usePresence` hook
- [ ] Update online count in TopBar
- [ ] Add online indicators to members
- [ ] Implement typing indicators

### Channel Features
- [ ] Handle channel CRUD events
- [ ] Update channel list in real-time
- [ ] Handle member changes
- [ ] Auto-navigation logic

### Error Handling
- [ ] Connection recovery
- [ ] Token refresh logic
- [ ] Offline mode support
- [ ] User notifications

### Testing
- [ ] Unit tests for SSE service
- [ ] Integration tests for hooks
- [ ] E2E tests for real-time features
- [ ] Performance testing

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SSE_URL=https://hudhud.baytlabs.com/api/realtime/stream
NEXT_PUBLIC_ENABLE_SSE=true
NEXT_PUBLIC_SSE_RECONNECT_INTERVAL=5000
NEXT_PUBLIC_SSE_MAX_RECONNECT_ATTEMPTS=10
```

### Feature Flags
```typescript
const features = {
  enableRealtime: true,
  enableTypingIndicators: true,
  enablePresence: true,
  enableNotificationSounds: false,
};
```

## Performance Considerations

### Message Handling
- Batch UI updates using `requestAnimationFrame`
- Debounce rapid message updates
- Limit message history in memory
- Use virtual scrolling for large message lists

### Connection Management
- Single SSE connection per user
- Efficient event distribution
- Cleanup on component unmount
- Memory leak prevention

## Security Considerations

### Authentication
- JWT token in SSE connection
- Token refresh before expiry
- Secure token storage
- CORS configuration

### Data Validation
- Validate all incoming events
- Sanitize message content
- Check user permissions
- Rate limiting awareness

## Rollout Strategy

### Phase 1: Internal Testing
1. Deploy to staging environment
2. Test with small user group
3. Monitor performance metrics
4. Gather feedback

### Phase 2: Gradual Rollout
1. Enable for 10% of users
2. Monitor error rates
3. Increase to 50%
4. Full rollout

### Phase 3: Optimization
1. Analyze performance data
2. Optimize based on usage patterns
3. Add advanced features
4. Documentation updates

## Monitoring & Metrics

### Key Metrics to Track
- Connection success rate
- Average reconnection time
- Message delivery latency
- Event processing time
- Memory usage
- Active connections

### Error Tracking
- Connection failures
- Authentication errors
- Message delivery failures
- Event parsing errors

## Fallback Mechanisms

### When SSE Fails
1. **Short-term**: Increase polling frequency
2. **Medium-term**: Use long polling
3. **Long-term**: Notify user of degraded experience

### Graceful Degradation
- Continue showing cached data
- Allow sending messages via REST
- Show connection status to user
- Provide manual refresh option

## Future Enhancements

### Potential Features
- [ ] Read receipts
- [ ] Message reactions in real-time
- [ ] Voice/video call notifications
- [ ] Screen sharing status
- [ ] File upload progress
- [ ] Collaborative editing

### Technology Upgrades
- Consider WebSocket for bidirectional needs
- Evaluate WebRTC for P2P features
- Research HTTP/3 for better performance
- Explore service workers for offline

## References

- [MDN EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [SSE vs WebSocket Comparison](https://www.smashingmagazine.com/2018/02/sse-websockets-data-flow-http2/)
- [React SSE Best Practices](https://react.dev/learn/synchronizing-with-effects)
- [Backend API Documentation](https://hudhud.baytlabs.com/api/docs)

## Support & Troubleshooting

### Common Issues
1. **Connection keeps dropping**: Check token expiry
2. **Messages not updating**: Verify event type handling
3. **High memory usage**: Check for event listener leaks
4. **Duplicate messages**: Implement proper deduplication

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('DEBUG_SSE', 'true');

// View connection status
window.__SSE_STATUS__ = realtimeService.getStatus();
```

---

*Last Updated: [Current Date]*
*Version: 1.0.0*