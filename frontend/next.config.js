/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration des images
  images: {
    domains: [
      'your-project.supabase.co',
      'supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'spotbulle-ia.onrender.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'spotbulle-ia.onrender.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Configuration pour le déploiement sur Render
  output: 'standalone',
  
  // Configuration des redirections et rewrites
  async rewrites() {
    // En production sur Render, pas besoin de rewrites car tout est sur le même serveur
    if (process.env.NODE_ENV === 'production' && process.env.RENDER) {
      return [];
    }
    
    // En développement, rediriger vers le backend local
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'}/:path*`,
      }
    ];
  },
  
  // Configuration Webpack
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
      };
    }
    
    // Optimisation des chunks
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
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
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Configuration des redirections
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Configuration du serveur de développement
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // Configuration de la compression
  compress: true,
  
  // Configuration des pages d'erreur personnalisées
  poweredByHeader: false,
  
  // Configuration pour les builds plus rapides
  swcMinify: true,
  
  // Configuration expérimentale
  experimental: {
    // Optimisations pour les builds
    optimizeCss: true,
    // Amélioration des performances
    scrollRestoration: true,
  },
  
  // Configuration TypeScript (si utilisé)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;

