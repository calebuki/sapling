import type { NextConfig } from "next";

// Every earlier screen now lives inside the island game at "/".
const retiredRoutes = ["/learn", "/practice", "/ear", "/my-danish", "/progress", "/world"];

const nextConfig: NextConfig = {
  headers() {
    return [
      {
        source: "/audio/:language/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  redirects() {
    return retiredRoutes.flatMap((route) => [
      { source: route, destination: "/", permanent: false },
      { source: `${route}/:path*`, destination: "/", permanent: false },
    ]);
  },
};

export default nextConfig;
