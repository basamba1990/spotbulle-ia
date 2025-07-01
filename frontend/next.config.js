/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration des images
  images: {
    domains: [
      "your-project.supabase.co",
      "supabase.co",
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "spotbulle-ia.onrender.com"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "spotbulle-ia.onrender.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Optimisations d'images
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Configuration pour le déploiement sur Render
  output: "standalone",
  
  // Désactiver le prerendering pour éviter les erreurs
  trailingSlash: false,
  
  // Configuration des redirections et rewrites
  async rewrites() {
    // En production sur Render, pas besoin de rewrites car tout est sur le même serveur
    if (process.env.NODE_ENV === "production" && process.env.RENDER) {
      return [];
    }
    
    // En développement, rediriger vers le backend local
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000"}/:path*`,
      }
    ];
  },
  
  // Configuration Webpack optimisée
  webpack: (config, { isServer, dev }) => {
    // Optimisations pour la production
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        util: false,
      };
    }
    
    // Optimisation des chunks pour réduire la taille du bundle
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: -10,
              chunks: "all",
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react",
              priority: 20,
              chunks: "all",
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Configuration des headers de sécurité
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        // Cache statique pour les assets
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  
  // Configuration des redirections
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
  
  // Configuration du serveur de développement
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: "bottom-right",
  },
  
  // Configuration de la compression
  compress: true,
  
  // Désactiver le header X-Powered-By
  poweredByHeader: false,
  
  // Configuration pour les builds plus rapides
  swcMinify: true,
  
  // Configuration expérimentale pour optimiser les performances
  experimental: {
    // Optimisations CSS
    optimizeCss: true,
    // Amélioration des performances de navigation
    scrollRestoration: true,
    // Optimisation des imports
    optimizePackageImports: ["axios", "date-fns", "clsx"],
    // Turbo mode pour les builds plus rapides
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  
  // Configuration TypeScript (si utilisé)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["src"],
  },
  
  // generateStaticParams n'est pas une option de next.config.js
  // Elle doit être définie au niveau de la page ou du layout.
  // Laisser cette clé ici génère un avertissement.
  // Nous la retirons pour éviter l'avertissement.
  // generateStaticParams: async () => {
  //   return [];
  // },
  
  // Configuration pour gérer les erreurs de build
  onDemandEntries: {
    // Période en ms pour garder les pages en mémoire
    maxInactiveAge: 25 * 1000,
    // Nombre de pages à garder simultanément
    pagesBufferLength: 2,
  },
  
  // Configuration pour optimiser les performances
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;

