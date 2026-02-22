"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/context/AuthContext";
import api, { BACKEND_URL } from "@/lib/api";

/**
 * WebPushSubscriber
 * 
 * Automatically subscribes the user's browser to Web Push notifications
 * using the Push API + VAPID. Only runs on web (not native Capacitor).
 * 
 * Flow:
 * 1. Fetch VAPID public key from backend
 * 2. Wait for service worker registration
 * 3. Subscribe to push via PushManager
 * 4. Send the subscription object to backend for storage
 * 
 * This component renders nothing — it only runs side effects.
 */
export default function WebPushSubscriber() {
    const { isSignedIn, user } = useAuth();
    const subscribed = useRef(false);

    useEffect(() => {
        // Only run on web, not inside native Capacitor app
        if (Capacitor.isNativePlatform()) return;
        if (!isSignedIn || !user) return;
        if (subscribed.current) return;

        // Don't run on server or if Push API is not supported
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.log("[WebPush] Push API not supported in this browser");
            return;
        }

        const subscribeToPush = async () => {
            try {
                // 1. Get VAPID public key from backend
                const { data } = await api.get("/api/users/push/vapid-key");
                const publicKey = data.publicKey;

                if (!publicKey) {
                    console.error("[WebPush] No VAPID public key returned from server");
                    return;
                }

                // 2. Wait for the service worker to be ready
                const registration = await navigator.serviceWorker.ready;
                console.log("[WebPush] Service worker ready");

                // 3. Check if already subscribed
                const existingSub = await registration.pushManager.getSubscription();
                if (existingSub) {
                    console.log("[WebPush] Already subscribed, syncing with backend...");
                    await syncSubscription(existingSub);
                    subscribed.current = true;
                    return;
                }

                // 4. Request notification permission
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    console.log("[WebPush] Notification permission denied");
                    return;
                }

                // 5. Subscribe to push
                const applicationServerKey = urlBase64ToUint8Array(publicKey);
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
                });

                console.log("[WebPush] Subscribed successfully:", subscription.endpoint.slice(-30));

                // 6. Send subscription to backend
                await syncSubscription(subscription);
                subscribed.current = true;
            } catch (err) {
                console.error("[WebPush] Subscription failed:", err);
            }
        };

        const syncSubscription = async (subscription: PushSubscription) => {
            try {
                const subJSON = subscription.toJSON();
                await api.post("/api/users/push/subscribe", {
                    subscription: {
                        endpoint: subJSON.endpoint,
                        keys: {
                            p256dh: subJSON.keys?.p256dh,
                            auth: subJSON.keys?.auth,
                        },
                    },
                });
                console.log("[WebPush] Subscription synced with backend");
            } catch (err) {
                console.error("[WebPush] Failed to sync subscription with backend:", err);
            }
        };

        // Small delay to avoid blocking initial render
        const timer = setTimeout(subscribeToPush, 3000);
        return () => clearTimeout(timer);
    }, [isSignedIn, user]);

    return null;
}

/**
 * Convert a URL-safe base64 string to a Uint8Array (required by PushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array<ArrayBuffer>;
}
