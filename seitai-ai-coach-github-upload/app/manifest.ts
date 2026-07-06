import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Seitai AI Coach",
    short_name: "AI Coach",
    description: "整体院向けAI音声添削・教育・経営改善SaaS",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
