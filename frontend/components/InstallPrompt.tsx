"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const isDismissed = useRef(false);

    useEffect(() => {
        // Check if iOS (since iOS doesn't support beforeinstallprompt)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        if (isIosDevice && !isStandalone) {
            // Show prompt for iOS users who haven't installed yet
            // We'll show this once per session or use local storage to limit frequency
            const hasSeenPrompt = sessionStorage.getItem('iosInstallPromptSeen');
            if (!hasSeenPrompt) {
                // Defer state update to avoid synchronous cascading render warning
                setTimeout(() => {
                    setIsIOS(true);
                    setShowPrompt(true);
                }, 0);
            }
        }

        // Standard PWA install prompt for Android/Desktop
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Only show if user hasn't dismissed it in this session
            if (!isDismissed.current) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        isDismissed.current = true;
        if (isIOS) {
            sessionStorage.setItem('iosInstallPromptSeen', 'true');
        }
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
                >
                    <div className="glass p-4 rounded-3xl border-t border-border shadow-2xl relative overflow-hidden backdrop-blur-xl bg-popover/80">
                        {/* Background Gradient Mesh */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -z-10" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h3 className="font-bold text-foreground text-base font-outfit">Install App</h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {isIOS
                                        ? "Install for the best experience. Tap the share button below and select 'Add to Home Screen'."
                                        : "Install our app for a better experience with fullscreen mode and offline access."
                                    }
                                </p>
                            </div>
                        </div>

                        {isIOS ? (
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
                                <Share className="w-4 h-4 text-blue-400" />
                                <span>Tap <span className="font-bold text-foreground">Share</span> then <span className="font-bold text-foreground">Add to Home Screen</span></span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Install Now
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
