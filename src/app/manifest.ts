import type { MetadataRoute } from "next";

/** Lets Yapoz be added to a phone's home screen, which iPhones require before they allow notifications. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yapoz", short_name: "Yapoz", start_url: "/app", display: "standalone", background_color: "#0E0D0B", theme_color: "#0E0D0B",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
