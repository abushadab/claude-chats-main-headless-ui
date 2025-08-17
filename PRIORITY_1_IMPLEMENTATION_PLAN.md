# Priority 1: Critical Core Features - Implementation Plan

## Overview
This document outlines the backend requirements and implementation approach for the 5 critical features.

---

## 1. Text Formatting 
**Current State:** UI buttons exist but don't work  
**Best Approach:** Client-side markdown with backend storage

### Frontend Tasks
- Implement markdown parsing library (e.g., `marked` or `remark`)
- Add formatting logic to toolbar buttons
- Store raw markdown in message content
- Render formatted HTML in message display
- Add keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)

### Backend Requirements
```typescript
// No backend changes needed! 
// Store markdown as plain text in existing 'content' field
// Example message content:
{
  "content": "This is **bold** and *italic* with `code`",
  "content_type": "markdown" // optional field for future
}
```

### Why This Approach?
- ✅ No backend changes required
- ✅ Backward compatible
- ✅ Search still works on raw text
- ✅ Can migrate old messages easily

---

## 2. Message Reactions
**Current State:** Button exists, no functionality  
**Best Approach:** Separate reactions table with real-time events

### Frontend Tasks
- Create reaction picker UI
- Add/remove reaction API calls
- Display reactions under messages
- Optimistic UI updates
- Real-time reaction sync

### Backend Requirements

#### Database Schema
```sql
-- New reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  emoji VARCHAR(50) NOT NULL, -- emoji character or custom emoji name
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji) -- One reaction per emoji per user
);

-- Index for fast queries
CREATE INDEX idx_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_reactions_user_id ON message_reactions(user_id);
```

#### API Endpoints
```typescript
// Add reaction
POST /api/messages/:messageId/reactions
Body: { emoji: "👍" }
Response: { success: true, reaction: {...} }

// Remove reaction  
DELETE /api/messages/:messageId/reactions/:emoji
Response: { success: true }

// Get reactions for messages (bulk)
GET /api/messages/reactions?message_ids=id1,id2,id3
Response: {
  "id1": [
    { emoji: "👍", count: 3, users: ["user1", "user2", "user3"], has_reacted: true }
  ]
}
```

#### Real-time Events (SSE)
```typescript
// When reaction added
{
  "type": "reaction_added",
  "message_id": "msg-id",
  "user_id": "user-id",
  "emoji": "👍",
  "username": "John Doe"
}

// When reaction removed
{
  "type": "reaction_removed",
  "message_id": "msg-id",
  "user_id": "user-id",
  "emoji": "👍"
}
```

---

## 3. File/Image Upload
**Current State:** Image preview works, upload incomplete  
**Best Approach:** Direct upload with progress tracking

### Frontend Tasks
- Complete multipart form upload
- Add progress bar UI
- Support multiple files
- Display file attachments
- Handle upload errors

### Backend Requirements

#### File Storage Options

**Option A: Local Storage (Development)**
```typescript
POST /api/files/upload
Content-Type: multipart/form-data
Body: file, channel_id, message_id (optional)

Response: {
  "file_id": "file-123",
  "url": "/api/files/file-123",
  "thumbnail_url": "/api/files/file-123/thumb", // for images
  "filename": "document.pdf",
  "size": 1024000,
  "mime_type": "application/pdf"
}
```

**Option B: Cloud Storage (Recommended for Production)**
```typescript
// 1. Get presigned upload URL
POST /api/files/upload-url
Body: { filename: "doc.pdf", mime_type: "application/pdf", size: 1024000 }
Response: { 
  "upload_url": "https://s3.amazon.com/...",
  "file_id": "file-123",
  "expires_at": "2024-01-01T00:00:00Z"
}

// 2. Upload directly to S3/Cloud Storage from frontend
PUT [upload_url]
Body: [file binary]

// 3. Confirm upload completion
POST /api/files/confirm
Body: { file_id: "file-123", message_id: "msg-456" }
```

#### Database Schema
```sql
-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  url TEXT NOT NULL,
  thumbnail_url TEXT, -- for images/videos
  metadata JSONB, -- dimensions, duration, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_message_id ON files(message_id);
CREATE INDEX idx_files_channel_id ON files(channel_id);
```

#### Message Update
```sql
-- Add files array to message response
SELECT m.*, 
  COALESCE(
    json_agg(
      json_build_object(
        'id', f.id,
        'filename', f.filename,
        'url', f.url,
        'size', f.size_bytes,
        'mime_type', f.mime_type
      )
    ) FILTER (WHERE f.id IS NOT NULL), 
    '[]'
  ) as files
FROM messages m
LEFT JOIN files f ON f.message_id = m.id
GROUP BY m.id;
```

---

## 4. Threading/Replies
**Current State:** Reply button exists, no thread UI  
**Best Approach:** Parent-child message relationship

### Frontend Tasks
- Thread sidebar/inline view
- Reply to message action
- Thread count display
- Thread participant avatars
- Collapsible threads

### Backend Requirements

#### Database Schema
```sql
-- Add to messages table
ALTER TABLE messages 
  ADD COLUMN thread_id UUID REFERENCES messages(id), -- Parent message ID
  ADD COLUMN thread_count INTEGER DEFAULT 0,
  ADD COLUMN thread_participants JSONB DEFAULT '[]',
  ADD COLUMN thread_last_reply_at TIMESTAMP;

-- Index for thread queries
CREATE INDEX idx_messages_thread_id ON messages(thread_id);

-- Thread metadata view
CREATE VIEW thread_summary AS
SELECT 
  thread_id,
  COUNT(*) as reply_count,
  MAX(created_at) as last_reply_at,
  array_agg(DISTINCT user_id) as participants
FROM messages
WHERE thread_id IS NOT NULL
GROUP BY thread_id;
```

#### API Endpoints
```typescript
// Reply to message (creates thread)
POST /api/messages/:messageId/reply
Body: { content: "Reply text", also_send_to_channel: false }
Response: { message: {...}, thread_id: "parent-id" }

// Get thread messages
GET /api/messages/:messageId/thread
Response: { 
  parent: {...},
  replies: [...],
  participants: [...],
  count: 5
}

// Get threads for multiple messages
GET /api/messages/threads?message_ids=id1,id2
Response: {
  "id1": { count: 3, last_reply_at: "...", participants: [...] }
}
```

#### Real-time Events
```typescript
// New thread reply
{
  "type": "thread_reply",
  "thread_id": "parent-msg-id",
  "message": {...},
  "thread_count": 5
}
```

---

## 5. Typing Indicators
**Current State:** Not implemented  
**Best Approach:** Ephemeral events via SSE/WebSocket

### Frontend Tasks
- Send typing start/stop events
- Display typing indicators
- Handle timeout (3-5 seconds)
- Show multiple users typing

### Backend Requirements

#### No Database Storage Needed!
Typing is ephemeral - use Redis or in-memory store

#### Redis Schema (Recommended)
```typescript
// Redis keys
typing:{channel_id} = Set of user IDs currently typing
typing:{channel_id}:{user_id} = Expiry timestamp (TTL 5 seconds)
```

#### API Endpoints
```typescript
// Start typing
POST /api/channels/:channelId/typing
Response: { success: true }
// Auto-expires after 5 seconds

// Stop typing (optional)
DELETE /api/channels/:channelId/typing
Response: { success: true }

// Get who's typing (optional, can use SSE only)
GET /api/channels/:channelId/typing
Response: { users: ["user1", "user2"] }
```

#### Real-time Events (SSE)
```typescript
// User started typing
{
  "type": "typing_start",
  "channel_id": "channel-123",
  "user_id": "user-456",
  "username": "John Doe"
}

// User stopped typing
{
  "type": "typing_stop",
  "channel_id": "channel-123",
  "user_id": "user-456"
}
```

#### Backend Logic
```javascript
// Typing handler (Node.js example)
const typingUsers = new Map(); // channel_id -> Set of users

function handleTyping(channelId, userId) {
  // Add user to typing set
  if (!typingUsers.has(channelId)) {
    typingUsers.set(channelId, new Set());
  }
  typingUsers.get(channelId).add(userId);
  
  // Broadcast to channel
  broadcastToChannel(channelId, {
    type: 'typing_start',
    user_id: userId
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    typingUsers.get(channelId)?.delete(userId);
    broadcastToChannel(channelId, {
      type: 'typing_stop',
      user_id: userId
    });
  }, 5000);
}
```

---

## Implementation Order & Timeline

### Week 1: Foundation
**Day 1-2: Text Formatting (Frontend Only)**
- ✅ No backend needed
- Implement markdown parsing
- Connect toolbar buttons
- Test formatting display

**Day 3-5: Reactions (Backend + Frontend)**
- Create reactions table
- Build API endpoints
- Implement UI
- Add real-time sync

### Week 2: Files & Threads
**Day 6-7: File Upload**
- Complete upload endpoint
- Add progress tracking
- Handle multiple files
- Display attachments

**Day 8-10: Threading**
- Update message schema
- Build thread APIs
- Create thread UI
- Test nested replies

### Week 3: Real-time
**Day 11-12: Typing Indicators**
- Setup Redis/memory store
- Implement SSE events
- Add typing UI
- Handle timeouts

**Day 13-14: Integration & Testing**
- Test all features together
- Fix edge cases
- Performance optimization
- Documentation

---

## Backend Technology Recommendations

### For PostgreSQL Stack:
```typescript
// Existing stack compatibility
- Reactions: New table with foreign keys ✅
- Files: New table + S3/local storage ✅
- Threads: Add columns to messages ✅
- Typing: Redis or in-memory ✅
```

### For MongoDB Stack:
```typescript
// Document-based approach
{
  "_id": "msg-123",
  "content": "Message with **formatting**",
  "reactions": [
    { "emoji": "👍", "users": ["user1", "user2"] }
  ],
  "files": [
    { "id": "file-1", "url": "...", "name": "doc.pdf" }
  ],
  "thread": {
    "parent_id": "msg-100",
    "count": 5,
    "last_reply": "2024-01-01T00:00:00Z"
  }
}
```

### For Real-time:
**Current SSE**: Good for reactions, threads, typing ✅  
**Optional WebSocket**: Better for high-frequency typing events

---

## Critical Success Factors

1. **Reactions must be instant** - Use optimistic UI
2. **Files must show progress** - Users need feedback
3. **Threads must be intuitive** - Clear parent-child relationship
4. **Typing must be smooth** - No lag or flicker
5. **Formatting must be reliable** - No data loss

---

## Minimal Backend Checklist

If backend resources are limited, here's the absolute minimum:

### Phase 1 (Can ship with these):
- [ ] Reactions table + 2 endpoints (add/remove)
- [ ] File upload endpoint (basic)
- [ ] Thread support (add thread_id to messages)
- [ ] SSE events for reactions

### Phase 2 (Can add later):
- [ ] Typing indicators
- [ ] File thumbnails
- [ ] Thread metadata
- [ ] Bulk APIs for performance

---

## Questions for Backend Team

1. **File Storage**: Local disk, S3, or other cloud storage?
2. **Real-time**: Stick with SSE or add WebSocket?
3. **Database**: PostgreSQL, MongoDB, or other?
4. **Redis**: Available for typing indicators?
5. **File Size**: Max upload size limits?
6. **Rate Limiting**: Needed for reactions/typing?