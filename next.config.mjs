/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000", 
        "bookish-parakeet-4j5rqxx6q4grhqrx6-3000.app.github.dev"
      ],
    },
  },
};

export default nextConfig;