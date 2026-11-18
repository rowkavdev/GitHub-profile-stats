/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  // Native binding: load it from node_modules at runtime instead of bundling it.
  serverExternalPackages: ["@resvg/resvg-js"],
  // The PNG export reads bundled fonts at runtime; make sure they ship with the route.
  outputFileTracingIncludes: {
    "/api/profile/png": ["./src/assets/fonts/**"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
