"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const APK_DOWNLOAD_URL = "https://github.com/vijesharumugam/contestReminder/releases/download/v1.1.0/app-release.apk";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

type Platform = 'android' | 'ios' | 'desktop';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<Platform>('desktop');
    const isDismissed = useRef(false);

    useEffect(() => {
        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        // Don't show if already installed as PWA or running inside Capacitor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (isStandalone || (window as any).Capacitor) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isIosDevice = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
        const isAndroidDevice = /android/.test(userAgent);

        if (isIosDevice) {
            const hasSeenPrompt = sessionStorage.getItem('iosInstallPromptSeen');
            if (!hasSeenPrompt) {
                setTimeout(() => {
                    setPlatform('ios');
                    setShowPrompt(true);
                }, 0);
            }
        } else if (isAndroidDevice) {
            // On Android, show APK download prompt after a short delay
            const hasSeenPrompt = sessionStorage.getItem('androidInstallPromptSeen');
            if (!hasSeenPrompt) {
                setTimeout(() => {
                    setPlatform('android');
                    setShowPrompt(true);
                }, 2000); // Show after 2 seconds
            }
        } else {
            // Desktop — use standard PWA install
            setPlatform('desktop');
        }

        // Standard PWA install prompt for Desktop
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            if (!isDismissed.current) {
                setPlatform('desktop');
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (platform === 'android') {
            // Download native APK
            window.open(APK_DOWNLOAD_URL, '_blank');
            sessionStorage.setItem('androidInstallPromptSeen', 'true');
            setShowPrompt(false);
            return;
        }

        // Desktop PWA install
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
        if (platform === 'ios') {
            sessionStorage.setItem('iosInstallPromptSeen', 'true');
        } else if (platform === 'android') {
            sessionStorage.setItem('androidInstallPromptSeen', 'true');
        }
    };

    const getPromptContent = () => {
        switch (platform) {
            case 'android':
                return {
                    icon: <Smartphone className="w-6 h-6 text-white" />,
                    title: 'Get the App',
                    description: 'Download our native Android app for the best experience with push notifications and faster performance.',
                    buttonText: 'Download App',
                };
            case 'ios':
                return {
                    icon: <Download className="w-6 h-6 text-white" />,
                    title: 'Install App',
                    description: "Install for the best experience. Tap the share button below and select 'Add to Home Screen'.",
                    buttonText: '',
                };
            default:
                return {
                    icon: <Download className="w-6 h-6 text-white" />,
                    title: 'Install App',
                    description: 'Install our app for a better experience with fullscreen mode and offline access.',
                    buttonText: 'Install Now',
                };
        }
    };

    const content = getPromptContent();

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
                                {content.icon}
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h3 className="font-bold text-foreground text-base font-outfit">{content.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {content.description}
                                </p>
                            </div>
                        </div>

                        {platform === 'ios' ? (
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
                                <Share className="w-4 h-4 text-blue-400" />
                                <span>Tap <span className="font-bold text-foreground">Share</span> then <span className="font-bold text-foreground">Add to Home Screen</span></span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                            >
                                {platform === 'android' ? (
                                    <Smartphone className="w-4 h-4" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {content.buttonText}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
