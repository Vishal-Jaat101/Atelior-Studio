import * as fs from 'fs';
import * as path from 'path';

// Parse root .env manually
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const val = vals.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = val;
      }
    }
  }
} catch (e) {}

async function testSketchfab() {
  const token = process.env.SKETCHFAB_API_TOKEN;
  console.log("Checking SKETCHFAB_API_TOKEN present:", !!token, token ? `(Length: ${token.length})` : '');

  // 1. Test Search Endpoint (Commercial-safe CC licenses only: by, by-sa, cc0)
  const searchUrl = "https://api.sketchfab.com/v3/search?type=models&downloadable=true&licenses=by&licenses=by-sa&licenses=cc0&q=chair";
  console.log("Searching Sketchfab:", searchUrl);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    console.error("Search failed status:", searchRes.status, await searchRes.text());
    return;
  }

  const searchData: any = await searchRes.json();
  console.log(`Found ${searchData.results?.length || 0} models matching search.`);

  if (!searchData.results || searchData.results.length === 0) {
    console.log("No models returned.");
    return;
  }

  const sampleModel = searchData.results[0];
  console.log("\nSample Model Details:");
  console.log("- UID:", sampleModel.uid);
  console.log("- Name:", sampleModel.name);
  console.log("- Author:", sampleModel.user?.username, `(${sampleModel.user?.profileUrl})`);
  console.log("- License:", sampleModel.license?.slug || sampleModel.license?.fullName);

  // 2. Test Download Endpoint with Token header vs Bearer header
  const downloadUrl = `https://api.sketchfab.com/v3/models/${sampleModel.uid}/download`;
  console.log("\nAttempting download metadata request for UID:", sampleModel.uid);

  // Try with Token header
  let headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  console.log("Testing with Authorization header:", token ? `Token ${token.substring(0, 4)}...` : 'None');
  let downloadRes = await fetch(downloadUrl, { headers });
  console.log("Download endpoint status (Token format):", downloadRes.status);
  let downloadBody = await downloadRes.json();
  console.log("Download endpoint response:", JSON.stringify(downloadBody, null, 2));

  // If 401/403 with Token, try Bearer
  if (!downloadRes.ok && token) {
    console.log("\nTesting with Authorization header: Bearer format...");
    downloadRes = await fetch(downloadUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log("Download endpoint status (Bearer format):", downloadRes.status);
    downloadBody = await downloadRes.json();
    console.log("Download endpoint response:", JSON.stringify(downloadBody, null, 2));
  }

  if (downloadRes.ok && (downloadBody.gltf?.url || downloadBody.glb?.url)) {
    const fileUrl = downloadBody.gltf?.url || downloadBody.glb?.url;
    console.log("\n✅ SUCCESS: Download URL obtained!", fileUrl);
  } else {
    console.log("\n❌ Download test result:", downloadRes.status, downloadBody);
  }
}

testSketchfab();
