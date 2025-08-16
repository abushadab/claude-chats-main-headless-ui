# Project Members Implementation Plan

## Overview
Implement proper Project Members API integration with separate loading states, caching, and improved UX.

## Current Issues
1. Using channel-specific `active_members` from workspace API instead of project-wide members
2. Skeleton shows for both channels and members together (wrong timing)
3. LoadingScreen shows on project/channel switches (should only show on initial load)
4. No members caching configuration
5. Members data changes per channel (should be consistent project-wide)

## Requirements
- Loading screen: ONLY on initial page load and page refresh
- Members section: Show ALL project members (not just active/online)
- Cache: Inherit from workspace cache setting
- Skeletons: Separate loading states for channels and members

## Implementation Steps

### Phase 1: Fix LoadingScreen Behavior
**Goal:** LoadingScreen only on initial load/refresh, not on navigation

1. **Update LoadingScreen logic in page.tsx**
   - Check if it's initial page load vs navigation
   - Use sessionStorage flag to track initial load
   - Skip LoadingScreen on project/channel switches

2. **Differentiate navigation types**
   - Initial load: No cache → LoadingScreen
   - Page refresh: Clear sessionStorage → LoadingScreen  
   - Project switch: Use skeletons, no LoadingScreen
   - Channel switch: Use skeletons, no LoadingScreen

### Phase 2: Implement Project Members API
**Goal:** Fetch project-wide members list

1. **Create Project Members service (projectsService.ts)**
   ```typescript
   async getProjectMembers(projectId: string): Promise<Member[]>
   ```

2. **Update Member interface**
   - Add `invited_by` and `invited_by_username` fields
   - Ensure compatibility with API response

3. **Add useProjectMembers hook**
   - Fetch members when project changes
   - Handle caching (inherit workspace cache setting)
   - Return loading state separately

### Phase 3: Separate Loading States
**Goal:** Independent skeletons for channels and members

1. **Update ChannelsSidebar props**
   ```typescript
   interface ChannelsSidebarProps {
     channels?: Channel[];
     members?: Member[];
     isLoadingMembers?: boolean; // New
   }
   ```

2. **Split skeleton logic**
   ```typescript
   const shouldShowChannelsSkeleton = !channels || channels.length === 0;
   const shouldShowMembersSkeleton = !members || isLoadingMembers;
   ```

3. **Update skeleton rendering**
   - Channels section: Show skeleton only when no channels
   - Members section: Show skeleton only when no members

### Phase 4: Integrate Members API with Page Component
**Goal:** Fetch and pass members data properly

1. **In page.tsx ChannelPageContent**
   - Call both workspace API and members API in parallel
   - Pass members and loading state to ChannelsSidebar
   - Handle caching based on settings

2. **API call flow**
   ```typescript
   // On project change
   Promise.all([
     workspaceService.getWorkspace(...),
     projectsService.getProjectMembers(projectId)
   ])
   ```

### Phase 5: Implement Members Caching
**Goal:** Cache members per project with proper invalidation

1. **Update cache.ts**
   - Members cache inherits workspace cache setting
   - Cache key: `members_${projectId}`
   - TTL: Same as channels (10 minutes)
   - Add `clearMembersCache()` function

2. **Cache invalidation triggers**
   - Project switch
   - Manual refresh
   - Member add/remove (future)

### Phase 6: UI Polish
**Goal:** Smooth transitions and proper scroll handling

1. **Handle overflow**
   - Add ScrollArea if members list is long
   - Maintain current scroll position on updates

2. **Loading state improvements**
   - Keep showing previous members during load (no flash)
   - Smooth skeleton transitions

## Testing Checklist

- [ ] LoadingScreen only shows on initial page load
- [ ] LoadingScreen shows on page refresh
- [ ] LoadingScreen does NOT show on project switch
- [ ] LoadingScreen does NOT show on channel switch
- [ ] Members skeleton shows independently from channels
- [ ] Members list stays consistent across channels
- [ ] Members show all project members (not just active)
- [ ] Members cache works when workspace cache is enabled
- [ ] No duplicate API calls
- [ ] Smooth transitions without flashing

## API Endpoints

**Project Members API:**
```
GET /api/projects/:projectId/members
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "members": [...],
  "count": number
}
```

## Cache Keys
- Workspace: `workspace_${projectSlug}_${channelSlug}`
- Channels: `channels_${projectId}` (from workspace cache)
- Members: `members_${projectId}` (new)

## Performance Considerations
- Parallel API calls for workspace and members
- Cache members for 10 minutes
- Show stale data while fetching fresh data
- Minimize re-renders with proper memoization