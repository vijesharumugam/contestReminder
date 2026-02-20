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
                // Check permissions
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log('Push notification permission not granted');
                    return;
                }

                // Create the channel to ensure notifications are delivered (especially for Android 8+)
                await PushNotifications.createChannel({
                    id: 'contest-reminders',
                    name: 'Contest Reminders',
                    description: 'Notifications for upcoming contests',
                    importance: 5, // Max importance
                    visibility: 1, // Public
                    vibration: true,
                });
                console.log('FCM: Notification channel verified/created');

                // Register with FCM
                await PushNotifications.register();

                // Listen for registration success
                PushNotifications.addListener('registration', async (token) => {
                    console.log('FCM: Token generated:', token.value);

                    // Send FCM token to backend
                    try {
                        await api.post('/api/users/fcm-token', {
                            fcmToken: token.value,
                        });
                        console.log('FCM: Token successfully synced with backend');
                        registered.current = true;
                    } catch (err) {
                        console.error('FCM: Failed to sync token with backend:', err);
                    }
                });

                // Listen for registration errors
                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push notification registration error:', error);
                });

                // Handle notification received while app is in foreground
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push notification received:', notification);
                    // The notification is automatically shown by the system
                });

                // Handle notification tap (when user taps a notification)
                PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    console.log('Push notification action:', action);
                    // Navigate to relevant page if needed
                    const data = action.notification.data;
                    if (data?.url) {
                        window.location.href = data.url;
                    }
                });

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
