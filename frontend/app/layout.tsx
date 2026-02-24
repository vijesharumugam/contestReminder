import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";
import NativePushWrapper from "@/components/NativePushWrapper";
import { InstallProvider } from "@/context/InstallContext";
import { AuthProvider } from "@/context/AuthContext";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "ContestRemind",
    template: "%s | ContestRemind",
  },
  description:
    "Track competitive programming contests across leading platforms and manage reminder delivery in one place.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="KBUWYUxbZx_yq2u3JtpDcsByGCYG6tNIt78oiUuHkj8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ContestRemind" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon.png" />
      </head>
      <body className="font-sans bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <InstallProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative min-h-screen flex flex-col" suppressHydrationWarning>
                <Sidebar />

                <div className="flex-1 md:ml-[252px] transition-all duration-300">
                  <main className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-[calc(5rem+env(safe-area-inset-top))] md:px-8 md:pb-8 md:pt-8 min-h-screen">
                    {children}
                  </main>

                  <div className="hidden md:block px-8 pb-8">
                    <Footer />
                  </div>
                </div>
              </div>
              <PWARegister />
              <InstallPrompt />
              <NativePushWrapper />
            </ThemeProvider>
          </InstallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
