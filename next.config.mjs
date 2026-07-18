const isDev = process.env.NODE_ENV === "development";

// style-src doit autoriser 'unsafe-inline' : l'app utilise des styles React
// inline (style={...}) partout (app/components/styles.js) plutôt que des
// classes CSS, migrer vers un CSP par nonce demanderait de passer toute
// l'app en rendu dynamique (cf. doc Next.js sur les nonces CSP).
const cspHeader = `
  default-src 'self';
  script-src 'self' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self' data:;
  connect-src 'self' https://va.vercel-scripts.com;
  worker-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader.replace(/\n/g, "") },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
