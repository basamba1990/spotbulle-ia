import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

// Metadata pour Next.js 14 - sans viewport et themeColor
export const metadata = {
  title: 'SpotBulle IA - Plateforme de partage vidéo',
  description: 'Partagez vos vidéos d\'événements et créez votre communauté avec SpotBulle IA',
  keywords: 'vidéo, partage, événements, communauté, upload, intelligence artificielle, IA',
  authors: [{ name: 'SpotBulle Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SpotBulle IA - Plateforme de partage vidéo',
    description: 'Partagez vos vidéos d\'événements et créez votre communauté avec l\'intelligence artificielle',
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://spotbulle-ia.vercel.app',
    siteName: 'SpotBulle IA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SpotBulle IA - Plateforme de partage vidéo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpotBulle IA - Plateforme de partage vidéo',
    description: 'Partagez vos vidéos d\'événements et créez votre communauté avec l\'intelligence artificielle',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Nouvelle fonction generateViewport pour Next.js 14
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
      { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
    ],
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Preconnect pour améliorer les performances */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch pour les domaines externes */}
        <link rel="dns-prefetch" href="//spotbulle-ia.onrender.com" />
        
        {/* Favicon et icônes */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <AuthProvider>
          <div className="min-h-full flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 mt-auto">
              <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      SpotBulle IA
                    </h3>
                    <p className="text-gray-600 mb-4">
                      La plateforme qui révolutionne le partage de vidéos d'événements avec l'intelligence artificielle. 
                      Créez, partagez et découvrez des moments uniques avec votre communauté.
                    </p>
                    <div className="flex space-x-4">
                      <a
                        href="#"
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                        aria-label="Facebook"
                      >
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                        aria-label="Twitter"
                      >
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                        aria-label="Instagram"
                      >
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                      Plateforme
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <a href="/events" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Événements
                        </a>
                      </li>
                      <li>
                        <a href="/upload" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Upload vidéo
                        </a>
                      </li>
                      <li>
                        <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Tableau de bord
                        </a>
                      </li>
                      <li>
                        <a href="/ia" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Intelligence Artificielle
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                      Support
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Centre d'aide
                        </a>
                      </li>
                      <li>
                        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Contact
                        </a>
                      </li>
                      <li>
                        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Conditions d'utilisation
                        </a>
                      </li>
                      <li>
                        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                          Politique de confidentialité
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} SpotBulle IA. Tous droits réservés.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

