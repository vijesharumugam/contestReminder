"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export default function PWARegister() {
    useEffect(() => {
        // If running natively, unregister any existing service worker to prevent duplicates
        if (Capacitor.isNativePlatform()) {
            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (const registration of registrations) {
                        registration.unregister();
                        console.log("Unregistered duplicate SW in native app");
                    }
                });
            }
            return;
        }

        // Standard PWA Service Worker Registration
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator
        ) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("SW registered: ", registration.scope);

                    // Check for updates periodically (every 60 minutes)
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000);
                })
                .catch((err) => {
                    console.log("SW registration failed: ", err);
                });
        }
    }, []);

    return null;
}
