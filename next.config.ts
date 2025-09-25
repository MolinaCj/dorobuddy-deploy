import type { NextConfig } from "next";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().split("T")[0],
    NEXT_PUBLIC_COMMIT_HASH:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.CF_PAGES_COMMIT_SHA ||
      "local",
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_CREATOR_NAME: "Clent James Molina",
  },
};

export default nextConfig;
