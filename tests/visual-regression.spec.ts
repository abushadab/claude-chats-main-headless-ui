import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Sidebar', () => {
  test('skeleton matches loaded sidebar layout', async ({ page }) => {
    // Navigate to skeleton test page
    await page.goto('/skeleton-test');
    
    // Take screenshot of skeleton
    const skeletonScreenshot = await page.locator('.w-14').screenshot();
    
    // Navigate to actual page
    await page.goto('/project/default/channel/general');
    
    // Wait for content to load
    await page.waitForSelector('text=Default Workspace');
    
    // Take screenshot of loaded sidebar
    const loadedScreenshot = await page.locator('.w-14').screenshot();
    
    // Compare dimensions
    expect(skeletonScreenshot).toMatchSnapshot('sidebar-skeleton.png');
    expect(loadedScreenshot).toMatchSnapshot('sidebar-loaded.png');
  });

  test('measure exact positions', async ({ page }) => {
    await page.goto('/skeleton-test');
    
    // Measure skeleton positions
    const skeletonLogo = await page.locator('.h-14').first().boundingBox();
    
    await page.goto('/project/default/channel/general');
    await page.waitForSelector('text=Hudhud');
    
    // Measure actual positions  
    const actualLogo = await page.locator('.h-14').first().boundingBox();
    
    // Compare positions
    expect(skeletonLogo?.x).toBe(actualLogo?.x);
    expect(skeletonLogo?.y).toBe(actualLogo?.y);
    expect(skeletonLogo?.width).toBe(actualLogo?.width);
    expect(skeletonLogo?.height).toBe(actualLogo?.height);
  });
});