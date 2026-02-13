import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Contest Reminder | Professional Contest Tracker",
  description: "Global coding contest reminder system for elite programmers. Never miss a match on Codeforces, CodeChef, or LeetCode.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
        <head>
          {/* Apple PWA meta tags */}
          <meta name="google-site-verification" content="KBUWYUxbZx_yq2u3JtpDcsByGCYG6tNIt78oiUuHkj8" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="CReminder" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        </head>
        <body className={`${inter.variable} ${outfit.variable} font-sans bg-slate-950 text-slate-100 antialiased overflow-x-hidden`} suppressHydrationWarning>
          <div className="relative min-h-screen flex flex-col">
            {/* Background elements for premium look */}
            <div className="fixed inset-0 -z-10 bg-slate-950">
              <div className="absolute top-0 left-[10%] h-[400px] w-[400px] md:h-[600px] md:w-[600px] rounded-full bg-blue-600/10 blur-[120px] opacity-50" />
              <div className="absolute bottom-0 right-[10%] h-[400px] w-[400px] md:h-[600px] md:w-[600px] rounded-full bg-purple-600/10 blur-[120px] opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            </div>

            <Navbar />
            <main className="flex-grow container mx-auto px-3 md:px-4 pt-24 md:pt-32 pb-24 md:pb-12">
              {children}
            </main>
            {/* Footer hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
              <Footer />
            </div>
          </div>
          <PWARegister />
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
