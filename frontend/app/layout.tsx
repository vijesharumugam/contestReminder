import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";
import NativePushWrapper from "@/components/NativePushWrapper";
import { InstallProvider } from "@/context/InstallContext";

import { ThemeProvider } from "@/components/theme-provider";

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
      <InstallProvider>
        <html lang="en" className="scroll-smooth" suppressHydrationWarning>
          <head>
            {/* Apple PWA meta tags */}
            <meta name="google-site-verification" content="KBUWYUxbZx_yq2u3JtpDcsByGCYG6tNIt78oiUuHkj8" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="CReminder" />
            <link rel="apple-touch-icon" href="/icon.png" />
            <link rel="apple-touch-icon" sizes="512x512" href="/icon.png" />
          </head>
          <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground antialiased overflow-x-hidden`} suppressHydrationWarning>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative min-h-screen flex flex-col" suppressHydrationWarning>
                {/* Background elements for premium look */}
                <div className="fixed inset-0 -z-10 bg-background transition-colors duration-300">
                  <div className="absolute top-0 left-[10%] h-[400px] w-[400px] md:h-[600px] md:w-[600px] rounded-full bg-blue-600/10 blur-[120px] opacity-50 dark:opacity-50 opacity-20" />
                  <div className="absolute bottom-0 right-[10%] h-[400px] w-[400px] md:h-[600px] md:w-[600px] rounded-full bg-purple-600/10 blur-[120px] opacity-50 dark:opacity-50 opacity-20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                </div>

                {/* Sidebar for Desktop, Bottom Nav for Mobile */}
                <Sidebar />

                {/* Main Content Area - Push content on desktop to account for sidebar */}
                <div className="flex-1 md:ml-[68px] transition-all duration-300">
                  <main className="container mx-auto px-4 md:px-8 pb-24 pt-[calc(5rem+env(safe-area-inset-top))] md:py-8 min-h-screen">
                    {children}
                  </main>

                  {/* Footer only visible on desktop inside main area */}
                  <div className="hidden md:block px-8">
                    <Footer />
                  </div>
                </div>
              </div>
              <PWARegister />
              <InstallPrompt />
              <NativePushWrapper />
            </ThemeProvider>
          </body>
        </html>
      </InstallProvider>
    </ClerkProvider>
  );
}
