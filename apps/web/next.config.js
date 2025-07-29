/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'web',
  },
};

module.exports = nextConfig;
