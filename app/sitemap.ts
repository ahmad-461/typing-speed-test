import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://typing-speed-test-pi-smoky.vercel.app";

  const paths = [
    "",
    "/about",
    "/leaderboard",
    "/history",
    "/data-protocol",
    "/rules-of-engagement",
    "/changelog",
  ];

  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));
}
