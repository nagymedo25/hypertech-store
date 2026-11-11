import type { Metadata, Viewport } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/config";

/* ============================================================
   HYPER TECH — Premium multi-font typography system
   • Alexandria           → display headlines (geometric, modern,
                            premium Arabic + Latin wordforms)
   • IBM Plex Sans Arabic → highly readable, refined body text
   • Space Grotesk        → technical numerals / Latin specs
   Each family has a dedicated editorial role — none of them is
   a generic default (no Roboto / Arial / system-ui identity).
   ============================================================ */

const alexandria = Alexandria({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-tech",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BUSINESS.nameArabic} | ${BUSINESS.nameLatin} — إلكترونيات المنصورة`,
    template: `%s | ${BUSINESS.nameArabic}`,
  },
  description: BUSINESS.description,
  keywords: [
    "هايبر تك",
    "HYPER TECH",
    "لابتوب المنصورة",
    "تجميعات كمبيوتر",
    "اكسسوارات كمبيوتر",
    "صيانة لابتوب",
    "المنصورة",
  ],
  openGraph: {
    title: `${BUSINESS.nameArabic} — ${BUSINESS.taglineArabic}`,
    description: BUSINESS.description,
    type: "website",
    locale: "ar_EG",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${alexandria.variable} ${plexArabic.variable} ${grotesk.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
