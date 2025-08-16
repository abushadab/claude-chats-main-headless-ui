// Test script to verify no duplicate project cache entries
// Run this in browser console after navigating to the app

function checkProjectCacheEntries() {
  const entries = [];
  
  // Check all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('project')) {
      const value = localStorage.getItem(key);
      let dataType = 'raw';
      
      try {
        const parsed = JSON.parse(value);
        if (parsed.data && parsed.timestamp) {
          dataType = 'cached';
        }
      } catch {}
      
      entries.push({
        key,
        size: new Blob([value]).size,
        type: dataType
      });
    }
  }
  
  // Group by similar keys
  const projectKeys = entries.filter(e => e.key.includes('claude_chat_projects'));
  const otherProjectKeys = entries.filter(e => !e.key.includes('claude_chat_projects'));
  
  console.log('=== Project Cache Analysis ===');
  console.log('\nProject-related cache entries:');
  projectKeys.forEach(e => {
    console.log(`  ${e.key} (${e.size} bytes, ${e.type})`);
  });
  
  if (otherProjectKeys.length > 0) {
    console.log('\nOther project-related keys:');
    otherProjectKeys.forEach(e => {
      console.log(`  ${e.key} (${e.size} bytes, ${e.type})`);
    });
  }
  
  // Check for duplicates
  const hasDuplicate = projectKeys.some(e => e.key === 'claude_chat_projects');
  
  if (hasDuplicate) {
    console.warn('\n⚠️ DUPLICATE FOUND: claude_chat_projects exists alongside claude_chat_projects_light');
    console.log('This indicates the old useProjectsCrud hook is still creating cache entries.');
  } else {
    console.log('\n✅ No duplicates found. Only claude_chat_projects_light exists as expected.');
  }
  
  return entries;
}

// Run the check
checkProjectCacheEntries();