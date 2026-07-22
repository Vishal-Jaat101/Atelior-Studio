import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function captureScreenshots() {
  console.log("==================================================");
  console.log("📸 Capturing Nocturne Design System Screenshots");
  console.log("==================================================\n");

  const artifactsDir = path.resolve(__dirname, '../artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000...");
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log("Network idle timeout, continuing with current render state...");
  }

  // Wait 2 seconds for WebGL canvas and fonts to render fully
  await page.waitForTimeout(2000);

  // 1. Capture Intake / Discovery View (with 3D Viewer)
  const path1 = path.join(artifactsDir, 'nocturne_discovery_3d.png');
  await page.screenshot({ path: path1, fullPage: false });
  console.log(`✅ Saved Screen 1 (Discovery & 3D Viewer): ${path1}`);

  // 2. Click "Launch Discovery Loop" button to advance state
  console.log("Interacting: Launching Discovery Loop...");
  const launchBtn = page.locator('button:has-text("Launch Discovery")').first();
  if (await launchBtn.isVisible()) {
    await launchBtn.click();
    await page.waitForTimeout(2500);
  }

  const path2 = path.join(artifactsDir, 'nocturne_interview_active.png');
  await page.screenshot({ path: path2, fullPage: false });
  console.log(`✅ Saved Screen 2 (Active Discovery Interview): ${path2}`);

  // 3. Capture Divergence / Architecture View if available, or QA View
  const submitBtn = page.locator('button:has-text("Submit Answers"), button:has-text("Run Design Divergence")').first();
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  const path3 = path.join(artifactsDir, 'nocturne_architecture_dashboard.png');
  await page.screenshot({ path: path3, fullPage: false });
  console.log(`✅ Saved Screen 3 (Architecture & System Dashboard): ${path3}`);

  await browser.close();

  console.log("\n==================================================");
  console.log("✅ Screenshot Capture Complete");
  console.log("==================================================");
}

captureScreenshots().catch(err => {
  console.error("Screenshot capture error:", err.message);
  process.exit(1);
});
