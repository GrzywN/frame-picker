export const seoConfig = {
  // Base configuration
  siteName: "Frame Picker",
  siteUrl: "https://framepicker.ai",
  description: "AI-powered video frame extraction for content creators. Get perfect profile pictures and action shots from your videos in seconds.",
  
  // Keywords
  keywords: [
    "video frame extraction",
    "AI video analysis", 
    "profile picture generator",
    "video thumbnails",
    "content creator tools",
    "TikTok tools",
    "YouTube thumbnails",
    "social media content",
    "video editing",
    "frame selection AI",
    "best frame finder",
    "video screenshot",
    "influencer tools",
    "hardstyle content",
    "gaming clips"
  ],
  
  // OpenGraph defaults
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Frame Picker",
    title: "Frame Picker - AI Video Frame Extraction",
    description: "Extract the perfect frames from your videos using AI. Ideal for profile pictures, thumbnails, and social media content.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Frame Picker - AI Video Frame Extraction"
      }
    ]
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@framepicker",
    creator: "@framepicker",
    title: "Frame Picker - AI Video Frame Extraction",
    description: "Extract the perfect frames from your videos using AI. Perfect for content creators, influencers, and social media.",
    image: "/twitter-card.png"
  },
  
  // Schema.org structured data
  structuredData: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Frame Picker",
    "description": "AI-powered video frame extraction tool for content creators",
    "url": "https://framepicker.ai",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web Browser",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "3 videos per month, 720p quality"
      },
      {
        "@type": "Offer", 
        "name": "Pro Plan",
        "price": "2.99",
        "priceCurrency": "USD",
        "description": "100 videos per month, 1080p HD quality, no watermarks"
      }
    ],
    "creator": {
      "@type": "Organization",
      "name": "Frame Picker",
      "url": "https://framepicker.ai"
    }
  }
}