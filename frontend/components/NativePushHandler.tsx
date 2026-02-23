"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import api from "@/lib/api";

/**
 * Handles native push notifications when running inside the Capacitor app.
 * Registers for push notifications, gets the FCM token, and sends it to the backend.
 * This component renders nothing — it only runs side effects.
 */
export default function NativePushHandler({ userId }: { userId: string | null }) {
    const registered = useRef(false);

    useEffect(() => {
        // Only run inside Capacitor native app
        if (!Capacitor.isNativePlatform()) return;
        if (!userId) return;
        if (registered.current) return;

        const setupPush = async () => {
            try {
                // 1. Add listeners FIRST (to catch the registration event)

                // Success: Sync token with backend
                await PushNotifications.addListener('registration', async (token) => {
                    console.log('FCM: Token generated:', token.value);
                    try {
                        await api.post('/api/users/fcm-token', {
                            fcmToken: token.value,
                        });
                        console.log('FCM: Token successfully synced with backend');
                        registered.current = true;
                    } catch (err: unknown) {
                        const msg = (typeof err === "object" && err !== null)
                            ? ((err as { response?: { data?: unknown }; message?: string }).response?.data
                                || (err as { message?: string }).message
                                || 'Unknown error')
                            : 'Unknown error';
                        console.error('FCM: Failed to sync token with backend:', msg);
                    }
                });

                // Error: Log it
                await PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push notification registration error:', error);
                });

                // Received: Foreground behavior
                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push notification received:', notification);
                });

                // Action: Tapping behavior
                await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    console.log('Push notification action:', action);
                    const data = action.notification.data;
                    if (data?.url) {
                        window.location.href = data.url;
                    }
                });

                // 2. Check permissions
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('Push notification permission not granted:', permStatus.receive);
                    return;
                }

                // 3. Create the channel for Android
                await PushNotifications.createChannel({
                    id: 'contest-reminders',
                    name: 'Contest Reminders',
                    description: 'Notifications for upcoming contests',
                    importance: 5,
                    visibility: 1,
                    vibration: true,
                });
                console.log('FCM: Notification channel verified/created');

                // 4. Register with FCM
                await PushNotifications.register();
                console.log('FCM: Registration requested');

            } catch (err) {
                console.error('Error setting up push notifications:', err);
            }
        };

        setupPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [userId]);

    // This component renders nothing
    return null;
}
