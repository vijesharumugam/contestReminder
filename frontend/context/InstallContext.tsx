"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

type Platform = 'android' | 'ios' | 'desktop' | 'native';

interface InstallContextType {
    isInstallable: boolean;
    platform: Platform;
    deferredPrompt: BeforeInstallPromptEvent | null;
    showPrompt: boolean;
    setShowPrompt: (show: boolean) => void;
    installApp: () => Promise<void>;
    APK_DOWNLOAD_URL: string;
}

const InstallContext = createContext<InstallContextType | undefined>(undefined);

export const APK_DOWNLOAD_URL = "https://github.com/vijesharumugam/contestReminder/releases/download/v3.0.0/app-release.apk";

const detectPlatform = (): Platform => {
    if (typeof window === "undefined") return "desktop";
    if (Capacitor.isNativePlatform()) return "native";

    const userAgent = navigator.userAgent.toLowerCase();
    const isIosDevice = /ipad|iphone|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    if (isIosDevice) return "ios";
    if (isAndroidDevice) return "android";
    return "desktop";
};

export function InstallProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform] = useState<Platform>(() => detectPlatform());

    useEffect(() => {
        if (platform === 'native') {
            return;
        }
        if (platform === 'ios') {
            const hasSeenPrompt = sessionStorage.getItem('iosInstallPromptSeen');
            if (!hasSeenPrompt) {
                // Delay slightly to not be annoying immediately on load
                setTimeout(() => setShowPrompt(true), 1000);
            }
        } else if (platform === 'android') {
            const hasSeenPrompt = sessionStorage.getItem('androidInstallPromptSeen');
            if (!hasSeenPrompt) {
                setTimeout(() => setShowPrompt(true), 2000);
            }
        }

        // PWA Install Prompt Listener
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Only show prompt automatically on desktop if not dismissed in this session
            if (platform === 'desktop' && !sessionStorage.getItem('desktopInstallPromptSeen')) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [platform]);

    const installApp = useCallback(async () => {
        if (platform === 'android') {
            window.open(APK_DOWNLOAD_URL, '_blank');
            sessionStorage.setItem('androidInstallPromptSeen', 'true');
            setShowPrompt(false);
            return;
        }

        if (platform === 'ios') {
            // iOS instruction modal
            setShowPrompt(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        setDeferredPrompt(null);
        setShowPrompt(false);
        sessionStorage.setItem('desktopInstallPromptSeen', 'true');
    }, [deferredPrompt, platform]);

    return (
        <InstallContext.Provider value={{
            isInstallable: !!deferredPrompt || platform === 'android' || platform === 'ios',
            platform,
            deferredPrompt,
            showPrompt,
            setShowPrompt,
            installApp,
            APK_DOWNLOAD_URL
        }}>
            {children}
        </InstallContext.Provider>
    );
}

export function useInstall() {
    const context = useContext(InstallContext);
    if (context === undefined) {
        throw new Error("useInstall must be used within an InstallProvider");
    }
    return context;
}
