"use client"

import { useState, useEffect } from "react";
import { AuthLoadingSkeleton } from "@/components/ui/skeleton-components";
import { SkeletonTestNav } from "@/components/SkeletonTestNav";

export default function SkeletonWithoutLSPage() {
  const [activeIndices, setActiveIndices] = useState({ project: 0, channel: 0 });
  
  useEffect(() => {
    // Check localStorage for last visited project/channel
    const lastVisitedProject = localStorage.getItem('last_visited_project');
    const lastVisitedChannel = localStorage.getItem('last_visited_channel');
    
    if (lastVisitedProject || lastVisitedChannel) {
      let projectIndex = 0;
      let channelIndex = 0;
      
      try {
        // Try to find the indices from cached data
        const cachedProjects = localStorage.getItem('claude_chat_projects_light');
        if (cachedProjects && lastVisitedProject) {
          const projects = JSON.parse(cachedProjects).data;
          if (projects && Array.isArray(projects)) {
            const index = projects.findIndex((p: any) => p.slug === lastVisitedProject);
            if (index !== -1) {
              projectIndex = index;
            }
          }
        }
        
        // For channels, we need to know which project's channels to check
        if (lastVisitedProject && lastVisitedChannel) {
          // First try with the project ID
          const projectId = cachedProjects ? JSON.parse(cachedProjects).data?.find((p: any) => p.slug === lastVisitedProject)?.project_id : null;
          if (projectId) {
            const channelsCached = localStorage.getItem(`claude_chat_channels_${projectId}`);
            if (channelsCached) {
              const channels = JSON.parse(channelsCached).data;
              if (channels && Array.isArray(channels)) {
                const index = channels.findIndex((c: any) => 
                  c.slug === lastVisitedChannel || 
                  c.name.toLowerCase().replace(/\s+/g, '-') === lastVisitedChannel
                );
                if (index !== -1) {
                  channelIndex = index;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error reading cached data:', e);
      }
      
      setActiveIndices({ project: projectIndex, channel: channelIndex });
    }
  }, []);

  return (
    <>
      <AuthLoadingSkeleton activeProjectIndex={activeIndices.project} activeChannelIndex={activeIndices.channel} />
      <SkeletonTestNav />
    </>
  );
}