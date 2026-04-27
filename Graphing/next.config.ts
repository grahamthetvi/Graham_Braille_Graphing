import type { NextConfig } from "next";

// GitHub Actions sets GITHUB_REPOSITORY=owner/repo. Project Pages live at
// https://owner.github.io/repo/ so we need basePath "/repo". Skip for
// https://user.github.io/ sites (repository name ends with .github.io).
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserGithubIoSite = /\.github\.io$/i.test(repo);
const basePath =
  isGithubPages && repo && !isUserGithubIoSite ? `/${repo}` : "";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
