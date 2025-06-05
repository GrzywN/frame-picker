import type { Metadata } from "next";
import { AuthProvider } from "@/shared/components/auth-provider";
import { seoConfig } from "@/shared/config/seo";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: seoConfig.siteName,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.description,
  keywords: seoConfig.keywords,
  authors: [{ name: "Frame Picker Team" }],
  creator: "Frame Picker",
  publisher: "Frame Picker",

  // OpenGraph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: seoConfig.siteUrl,
    siteName: seoConfig.siteName,
    title: seoConfig.openGraph.title,
    description: seoConfig.openGraph.description,
    images: seoConfig.openGraph.images,
  },

  // Twitter
  twitter: seoConfig.twitter,

  // Additional meta tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification tags
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // Manifest
  manifest: "/site.webmanifest",

  // Additional tags
  other: {
    "theme-color": "#00E5FF",
    "msapplication-TileColor": "#00E5FF",
  },
};

export const getPageMetadata = (page: {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata => ({
  title: page.title,
  description: page.description || seoConfig.description,
  robots: page.noIndex ? { index: false, follow: false } : undefined,
  openGraph: {
    title: page.title,
    description: page.description || seoConfig.description,
    images: page.image ? [{ url: page.image }] : seoConfig.openGraph.images,
  },
  twitter: {
    title: page.title,
    description: page.description || seoConfig.description,
    images: [page.image ? { url: page.image } : seoConfig.twitter.image],
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoConfig.structuredData),
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
