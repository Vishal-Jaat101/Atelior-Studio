import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Load root .env file relative to this workspace app
const rootEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(rootEnvPath)) {
  const envContent = fs.readFileSync(rootEnvPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0]?.trim();
      let val = parts.slice(1).join("=").trim();

      // Strip outer quotes if any
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
      }

      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
