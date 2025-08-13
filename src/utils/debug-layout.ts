// Debug utility to compare element positions
export function debugLayout(selector: string) {
  if (typeof window === 'undefined') return;
  
  const elements = document.querySelectorAll(selector);
  const measurements: any[] = [];
  
  elements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    
    measurements.push({
      index,
      className: el.className,
      position: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      padding: styles.padding,
      margin: styles.margin,
    });
  });
  
  console.table(measurements);
  return measurements;
}

// Usage in browser console:
// debugLayout('.w-14') // Check all sidebar containers
// debugLayout('.h-14') // Check all headers