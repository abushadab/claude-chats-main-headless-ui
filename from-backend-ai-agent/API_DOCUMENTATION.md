# Chat Monolith API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Credentials](#test-credentials)
4. [Authentication](#authentication)
5. [Chat & Messages](#chat--messages)
6. [Reactions & Threads](#reactions--threads)
7. [File Upload](#file-upload)
8. [Admin Endpoints](#admin-endpoints)
9. [Real-time Features](#real-time-features)
10. [Frontend Integration](#frontend-integration)
11. [Error Handling](#error-handling)

## Overview

**Base URL**: `http://localhost:8891/api`  
**WebSocket**: `ws://localhost:8891`  
**SSE Stream**: `http://localhost:8891/api/realtime/stream`

### Architecture
- **Backend**: Node.js Express monolith (Port 8891)
- **Database**: PostgreSQL (Port 5433)
- **Cache/PubSub**: Redis (Port 6380)
- **File Storage**: Local filesystem (configurable)

### User Roles
- **member**: Regular user (default)
- **moderator**: Can moderate content and ban users
- **admin**: Full system access

## Quick Start

```bash
# 1. Check health
curl http://localhost:8891/health

# 2. Login
curl -X POST http://localhost:8891/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"Test123!@#"}'

# 3. Use the token from response
export TOKEN="YOUR_JWT_TOKEN"

# 4. Send a message
curl -X POST http://localhost:8891/api/chat/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","channelId":"b91d0bfb-0d4e-4a53-b431-1f7ca72e086c"}'
```

## Test Credentials

| Role | Email | Password | Username |
|------|-------|----------|----------|
| **Admin** | admin@chatapp.com | admin123!@# | admin |
| **Moderator** | bob.wilson@example.com | Test123!@# | bobwilson |
| **User 1** | john.doe@example.com | Test123!@# | johndoe |
| **User 2** | jane.smith@example.com | Test123!@# | janesmith |
| **User 3** | alice.jones@example.com | Test123!@# | alicejones |
| **Test** | test@example.com | Test123!@# | testuser |

All users are members of the `#general` channel.

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "newuser",
  "password": "SecurePass123!",
  "fullName": "New User"
}

Response:
{
  "success": true,
  "user": { "id": "uuid", "email": "...", "role": "member" },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",  // or use "username"
  "password": "SecurePass123!"
}

Response: Same as register
```

### Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=...

Response:
{
  "success": true,
  "accessToken": "new.jwt.token"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer YOUR_TOKEN
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "fullName": "Updated Name",
  "avatarUrl": "https://..."
}
```

### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

## Chat & Messages

### Get Messages
```http
GET /api/chat/messages?channelId=uuid&limit=50&before=timestamp&after=timestamp
Authorization: Bearer YOUR_TOKEN

Response:
{
  "success": true,
  "messages": [
    {
      "message_id": "uuid",
      "content": "Hello world",
      "user_id": "uuid",
      "username": "johndoe",
      "channel_id": "uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "edited_at": null,
      "deleted_at": null,
      "thread_count": 0,
      "reactions": []
    }
  ],
  "count": 50
}
```

### Send Message
```http
POST /api/chat/messages
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "Hello everyone!",
  "channelId": "uuid",
  "type": "text",  // text|image|file|system
  "metadata": {}
}
```

### Edit Message
```http
PUT /api/chat/messages/:messageId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "Updated message"
}
```

### Delete Message
```http
DELETE /api/chat/messages/:messageId
Authorization: Bearer YOUR_TOKEN
```

### Search Messages
```http
GET /api/chat/messages/search?q=keyword&channelId=uuid&limit=50
Authorization: Bearer YOUR_TOKEN
```

### Mark as Read
```http
POST /api/chat/messages/read
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "messageIds": ["uuid1", "uuid2"]
}
```

## Reactions & Threads

### Add Reaction
```http
POST /api/chat/messages/:messageId/reactions
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "emoji": "👍"
}
```

### Remove Reaction
```http
DELETE /api/chat/messages/:messageId/reactions/:emoji
Authorization: Bearer YOUR_TOKEN
```

### Get Message Reactions
```http
GET /api/chat/messages/:messageId/reactions
Authorization: Bearer YOUR_TOKEN

Response:
{
  "success": true,
  "reactions": [
    {
      "emoji": "👍",
      "count": 5,
      "users": [
        {
          "userId": "uuid",
          "username": "johndoe",
          "createdAt": "2025-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### Get Thread Replies
```http
GET /api/chat/messages/:messageId/replies?limit=50
Authorization: Bearer YOUR_TOKEN
```

### Send Thread Reply
```http
POST /api/chat/messages/:messageId/replies
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "This is a reply",
  "type": "text"
}
```

## File Upload

### Upload Single File
```http
POST /api/upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

FormData:
- file: [binary data]

Response:
{
  "success": true,
  "file": {
    "id": "uuid",
    "name": "image.jpg",
    "type": "image",
    "size": 102400,
    "url": "/uploads/images/1234-uuid.jpg",
    "mimetype": "image/jpeg"
  }
}
```

### Upload Multiple Files
```http
POST /api/upload/multiple
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

FormData:
- files[]: [binary data]
- files[]: [binary data]

Response:
{
  "success": true,
  "files": [...]
}
```

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word, Text
- **Videos**: MP4, WebM, OGG
- **Audio**: MP3, OGG, WAV, WebM
- **Max Size**: 10MB (configurable)

## Admin Endpoints

### User Management

#### List All Users
```http
GET /api/admin/users?limit=50&page=1&role=member&status=active&search=john
Authorization: Bearer ADMIN_TOKEN

Query Parameters:
- limit: Results per page (default: 50)
- page: Page number
- role: member|moderator|admin
- status: active|banned|deleted
- search: Search in email/username/name
- orderBy: created_at|updated_at|last_seen
- order: ASC|DESC
```

#### Update User Role
```http
PUT /api/admin/users/:userId/role
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "role": "moderator"  // member|moderator|admin
}
```

#### Ban User
```http
POST /api/admin/users/:userId/ban
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "duration": 86400,  // seconds (optional, permanent if omitted)
  "reason": "Spam"
}
```

#### Unban User
```http
POST /api/admin/users/:userId/unban
Authorization: Bearer ADMIN_TOKEN
```

#### Delete User
```http
DELETE /api/admin/users/:userId
Authorization: Bearer ADMIN_TOKEN
Note: Admin only, soft deletes user and their content
```

#### Reset User Password
```http
POST /api/admin/users/:userId/reset-password
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "newPassword": "NewSecurePass123!"
}
Note: Admin only, logs out all user sessions
```

### System Management

#### Get Statistics
```http
GET /api/admin/statistics
Authorization: Bearer ADMIN_TOKEN

Response:
{
  "statistics": {
    "users": {
      "total_users": 150,
      "active_users": 140,
      "banned_users": 10,
      "new_users_24h": 5,
      "active_24h": 45
    },
    "messages": {
      "total_messages": 5000,
      "messages_24h": 250
    },
    "channels": {
      "total_channels": 20,
      "avg_members": 25
    }
  }
}
```

#### Broadcast Message
```http
POST /api/admin/broadcast
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "content": "System maintenance at 10 PM",
  "channelId": "uuid"  // optional, defaults to #general
}
Note: Admin only
```

## Real-time Features

### Server-Sent Events (SSE)
```javascript
const eventSource = new EventSource(
  `http://localhost:8891/api/realtime/stream?token=${accessToken}`
);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('New message:', data);
});

eventSource.addEventListener('channel_message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Channel message:', data);
});

eventSource.addEventListener('typing', (event) => {
  const data = JSON.parse(event.data);
  console.log('User typing:', data);
});

eventSource.addEventListener('reaction', (event) => {
  const data = JSON.parse(event.data);
  console.log('Reaction added:', data);
});
```

### WebSocket (Socket.IO)
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:8891', {
  auth: { token: accessToken }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join-channels', ['channel-uuid']);
});

socket.on('new-message', (message) => {
  console.log('New message:', message);
});

socket.on('user-typing', (data) => {
  console.log('User typing:', data);
});

// Send typing indicator
socket.emit('typing-start', { channelId: 'uuid' });
socket.emit('typing-stop', { channelId: 'uuid' });
```

### Typing Indicators
```http
POST /api/chat/typing
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "channelId": "uuid"
}
```

## Frontend Integration

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8891/api
NEXT_PUBLIC_WS_URL=ws://localhost:8891
NEXT_PUBLIC_SSE_URL=http://localhost:8891/api/realtime/stream
```

### Auth Service Example
```javascript
class AuthService {
  async login(credentials) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'  // Important for cookies
    });
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      // Refresh token is set as HTTP-only cookie automatically
    }
    return data;
  }

  async refreshToken() {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    return data.success;
  }
}
```

### Axios Interceptor for Auto-Refresh
```javascript
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        const token = localStorage.getItem('accessToken');
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

### React Hook Example
```javascript
export function useChat(channelId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial messages
    loadMessages();
    
    // Connect to SSE for real-time updates
    const eventSource = new EventSource(
      `${SSE_URL}?token=${getAccessToken()}`
    );
    
    eventSource.addEventListener('channel_message', (event) => {
      const message = JSON.parse(event.data);
      if (message.channelId === channelId) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    return () => eventSource.close();
  }, [channelId]);

  const sendMessage = async (content) => {
    const response = await fetch(`${API_URL}/chat/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, channelId })
    });
    return response.json();
  };

  return { messages, loading, sendMessage };
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Rate Limiting
- Auth endpoints: 5 attempts per 15 minutes
- Global API: 100 requests per 15 minutes
- Messages: 100 per minute
- Headers include: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Database Schema

### Key Tables
```sql
users
├── id (UUID, PK)
├── email (unique)
├── username (unique)
├── password_hash
├── role (member|moderator|admin)
└── status (active|banned|deleted)

claude_messages
├── message_id (UUID, PK)
├── user_id (FK → users)
├── channel_id (FK → channels)
├── parent_message_id (FK → messages, for threads)
├── content
├── thread_count
└── deleted_at (soft delete)

message_reactions
├── message_id (FK → messages)
├── user_id (FK → users)
└── emoji

channels
├── channel_id (UUID, PK)
├── name (unique)
├── owner_id (FK → users)
└── is_private

channel_members
├── channel_id (FK → channels)
├── user_id (FK → users)
└── role (member|moderator|admin)
```

## Security Features

1. **JWT Authentication**
   - Access token: 15 minutes expiry
   - Refresh token: 7 days expiry (HTTP-only cookie)

2. **Password Security**
   - Bcrypt hashing with salt rounds
   - Minimum 8 characters required
   - Password change invalidates all sessions

3. **Rate Limiting**
   - Prevents brute force attacks
   - Configurable per endpoint

4. **Role-Based Access Control**
   - Admin endpoints require admin/moderator role
   - Channel access validated per request

5. **Input Validation**
   - All inputs sanitized and validated
   - SQL injection protection via parameterized queries

6. **CORS Configuration**
   - Configured for frontend domains
   - Credentials support enabled

## Testing

### Health Check
```bash
curl http://localhost:8891/health
```

### Full Flow Test
```bash
# 1. Register
curl -X POST http://localhost:8891/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Test123!@#"}'

# 2. Login and get token
TOKEN=$(curl -X POST http://localhost:8891/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#"}' \
  | jq -r '.tokens.accessToken')

# 3. Send message
curl -X POST http://localhost:8891/api/chat/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","channelId":"b91d0bfb-0d4e-4a53-b431-1f7ca72e086c"}'

# 4. Add reaction
curl -X POST http://localhost:8891/api/chat/messages/MESSAGE_ID/reactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}'
```

## Performance Tips

1. **Use pagination** - Don't load all messages at once
2. **Implement caching** - Cache user data and channel lists
3. **Debounce typing indicators** - Limit typing event frequency
4. **Batch API calls** - Use Promise.all for multiple requests
5. **Use SSE for real-time** - More efficient than polling
6. **Lazy load images** - Load images as they come into view

## Support & Troubleshooting

### Common Issues

**CORS Error**
- Ensure `withCredentials: true` in requests
- Check ALLOWED_ORIGINS environment variable

**401 Unauthorized**
- Token may be expired, implement auto-refresh
- Check Authorization header format: `Bearer TOKEN`

**SSE Not Connecting**
- Verify token is included in query params
- Check if server allows EventSource connections

**WebSocket Failing**
- Ensure Socket.IO client version matches server
- Check firewall/proxy settings

### Debug Mode
```javascript
// Enable Socket.IO debug
localStorage.setItem('debug', 'socket.io-client:*');

// Log all API calls
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});
```

---

**API Version**: 1.0.0  
**Last Updated**: August 2025  
**Status**: Production Ready 🚀

For questions or issues, check the server logs at `/var/log/chat-monolith.log`