import GoogleAnalyticsConsent from "@/components/GoogleAnalyticsConsent";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "github stats",
    "github profile stats",
    "github readme stats",
    "github stats card",
    "github profile readme",
    "readme stats generator",
    "github contribution stats",
    "github streak stats",
    "svg stats card",
    "developer stats",
    "github activity",
    "open source",
    "github readme generator",
    "profile readme",
    "github stats badge",
  ],
  authors: [{ name: SITE.authorName, url: SITE.authorUrl }],
  creator: SITE.creator,
  publisher: SITE.publisher,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: SITE.ogImagePath,
        width: 1200,
        height: 630,
        alt: SITE.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [SITE.ogImagePath],
    creator: `@${SITE.creator}`,
  },
  alternates: {
    canonical: SITE.url,
  },
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE.url}/#application`,
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "GitHub README generator",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: SITE.authorName,
        url: SITE.authorUrl,
      },
      sourceOrganization: {
        "@type": "Organization",
        name: "GitHub",
        url: "https://github.com",
      },
      codeRepository: SITE.repoUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0d1117] text-[#c9d1d9] antialiased">
        {children}
        <GoogleAnalyticsConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
