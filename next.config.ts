import type { NextConfig } from "next";

/**
 * Relais vers le serveur (backend). Certains opérateurs mobiles n'atteignent pas l'adresse `onrender.com` : en
 * passant par `soorooms.com/backend/...`, le téléphone ne parle qu'à soorooms.com, et c'est Vercel qui appelle le
 * serveur. Inactif tant que NEXT_PUBLIC_API_URL ne pointe pas vers ce relais.
 */
const BACKEND_URL = (process.env.BACKEND_PROXY_TARGET ?? "https://soorooms-backend.onrender.com").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
