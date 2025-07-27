/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'homepage',
  },
};

module.exports = nextConfig; 
module.exports = nextConfig 