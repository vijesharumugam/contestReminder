"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api";
import { Send, CheckCircle2, RefreshCw, AlertCircle, Unlink, Bell, Clock, Sparkles, MessageSquare, Zap, BellRing, BellOff, Smartphone } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UserData {
    _id: string;
    clerkId: string;
    email: string;
    telegramChatId?: string;
    pushSubscriptions?: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
    preferences: {
        push: boolean;
        telegram: boolean;
    };
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [subscribingPush, setSubscribingPush] = useState(false);


    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

    // Check push support
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPushSupported(true);
            setPushPermission(Notification.permission);
        }
    }, []);

    const fetchUserStatus = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get(`/api/users/${user.id}`);
            setUserData(res.data);
        } catch (err) {
            console.error("Error fetching user status:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserStatus();
        }
    }, [isLoaded, user, fetchUserStatus]);

    // ===== PUSH NOTIFICATION HANDLERS =====
    const enablePushNotifications = async () => {
        if (!user || !pushSupported) return;
        setSubscribingPush(true);

        try {
            // Request permission
            const permission = await Notification.requestPermission();
            setPushPermission(permission);

            if (permission !== 'granted') {
                alert('Please allow notifications in your browser settings to receive contest reminders.');
                setSubscribingPush(false);
                return;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            const subscriptionJSON = subscription.toJSON();

            // Send subscription to backend
            const res = await api.post(`/api/users/push/subscribe`, {
                clerkId: user.id,
                subscription: {
                    endpoint: subscriptionJSON.endpoint,
                    keys: {
                        p256dh: subscriptionJSON.keys?.p256dh,
                        auth: subscriptionJSON.keys?.auth
                    }
                }
            });

            setUserData(res.data.user);
            console.log('[Push] Subscribed successfully');
        } catch (err) {
            console.error('[Push] Subscription failed:', err);
            alert('Failed to enable push notifications. Please try again.');
        } finally {
            setSubscribingPush(false);
        }
    };

    const disablePushNotifications = async () => {
        if (!user) return;
        if (!confirm('Disable push notifications? You won\'t receive contest reminders from the app.')) return;

        setSubscribingPush(true);
        try {
            // Unsubscribe from push in browser
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            // Remove from backend
            const res = await api.post(`/api/users/push/unsubscribe`, {
                clerkId: user.id,
                endpoint: subscription?.endpoint
            });

            setUserData(res.data.user);
        } catch (err) {
            console.error('[Push] Unsubscribe failed:', err);
        } finally {
            setSubscribingPush(false);
        }
    };

    // ===== TELEGRAM HANDLERS =====
    const toggleTelegramPreference = async () => {
        if (!userData || !user) return;
        setUpdating(true);
        try {
            const newPrefs = { ...userData.preferences, telegram: !userData.preferences.telegram };
            const res = await api.put(`/api/users/preferences`, {
                clerkId: user.id,
                preferences: newPrefs,
            });
            setUserData(res.data);
        } catch (err) {
            console.error("Update failed:", err);
        } finally {
            setUpdating(false);
        }
    };

    const disconnectTelegram = async () => {
        if (!user || !confirm('Disconnect Telegram? You will stop receiving Telegram notifications.')) return;
        setDisconnecting(true);
        try {
            const res = await api.post(`/api/users/disconnect-telegram`, {
                clerkId: user.id,
            });
            setUserData(res.data);
        } catch (err) {
            console.error("Disconnect failed:", err);
            alert('Failed to disconnect Telegram. Please try again.');
        } finally {
            setDisconnecting(false);
        }
    };

    if (!isLoaded || loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Loading settings...</p>
            </div>
        </div>
    );

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ContestReminderBot";
    const telegramLink = `https://t.me/${botUsername}?start=${user?.id}`;
    const isTelegramConnected = !!userData?.telegramChatId;
    const isTelegramEnabled = userData?.preferences?.telegram;
    const isPushEnabled = userData?.preferences?.push && (userData?.pushSubscriptions?.length ?? 0) > 0;

    return (
        <div className="max-w-lg mx-auto space-y-4 md:space-y-6">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-500/15 rounded-lg">
                        <Bell className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-blue-400">Notifications</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-outfit text-foreground">Settings</h1>
                <p className="text-muted-foreground text-xs md:text-sm">Choose how you want to receive contest reminders</p>
            </motion.div>

            {/* ======= PRIMARY: Push Notifications ======= */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass rounded-2xl md:rounded-3xl overflow-hidden"
            >
                {/* Header */}
                <div className="relative px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-purple-600/20 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="bg-blue-500/25 p-1.5 md:p-2 rounded-lg md:rounded-xl border border-blue-500/20">
                                <BellRing className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm md:text-base text-foreground">Push Notifications</h3>
                                    <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20">Primary</span>
                                </div>
                                <p className="text-[10px] md:text-xs text-blue-300/60 dark:text-blue-300/60 text-blue-600/60 leading-tight">Native app-like notifications</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6">
                    {!pushSupported ? (
                        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/15 p-3 rounded-xl text-amber-400 text-xs md:text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.</span>
                        </div>
                    ) : pushPermission === 'denied' ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/15 p-3 rounded-xl text-red-400 text-xs md:text-sm">
                                <BellOff className="w-4 h-4 flex-shrink-0" />
                                <span>Notifications are blocked. Please enable them in your browser settings and refresh.</span>
                            </div>
                        </div>
                    ) : !isPushEnabled ? (
                        <div className="space-y-4">
                            <div className="text-center space-y-1.5 py-2">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto border border-blue-500/15">
                                    <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">Enable Push Notifications</p>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                    Get native notifications for daily digests and contest reminders — just like a real app.
                                </p>
                            </div>
                            <button
                                onClick={enablePushNotifications}
                                disabled={subscribingPush}
                                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 text-sm md:text-base active:scale-[0.98] disabled:opacity-50"
                            >
                                {subscribingPush ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <BellRing className="w-4 h-4" />
                                )}
                                {subscribingPush ? 'Enabling...' : 'Enable Notifications'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Status */}
                            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/15 p-3 rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs md:text-sm text-emerald-400 font-medium">Push notifications enabled</span>
                                <span className="ml-auto text-[10px] text-slate-500">{userData?.pushSubscriptions?.length} device(s)</span>
                            </div>

                            {/* Active features */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl bg-muted/50">
                                    <div className="w-7 h-7 bg-blue-500/15 rounded-md flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs md:text-sm font-semibold text-foreground">Daily Digest</p>
                                        <p className="text-[10px] text-muted-foreground">Every morning at 8:00 AM IST</p>
                                    </div>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl bg-muted/50">
                                    <div className="w-7 h-7 bg-purple-500/15 rounded-md flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs md:text-sm font-semibold text-foreground">30-Min Reminders</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground">Alert before contest starts</p>
                                    </div>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                            </div>

                            <div className="border-t border-white/5 my-1" />

                            <button
                                onClick={disablePushNotifications}
                                disabled={subscribingPush}
                                className="flex items-center justify-center gap-2 w-full text-muted-foreground hover:text-destructive py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 text-xs md:text-sm hover:bg-destructive/5 active:scale-[0.98]"
                            >
                                {subscribingPush ? <Spinner size="sm" /> : <BellOff className="w-3.5 h-3.5" />}
                                Disable Push Notifications
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ======= SECONDARY: Telegram ======= */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl md:rounded-3xl overflow-hidden"
            >
                {/* Header */}
                <div className="relative px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-sky-600/15 via-cyan-600/10 to-teal-600/15 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="bg-sky-500/25 p-1.5 md:p-2 rounded-lg md:rounded-xl border border-sky-500/20">
                                <Send className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm md:text-base text-foreground">Telegram</h3>
                                    <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border border-border">Optional</span>
                                </div>
                                <p className="text-[10px] md:text-xs text-sky-300/60 dark:text-sky-300/60 text-sky-600/60 leading-tight">Get reminders on Telegram too</p>
                            </div>
                        </div>
                        {isTelegramConnected && (
                            <button
                                onClick={toggleTelegramPreference}
                                disabled={updating}
                                className={cn(
                                    "w-11 h-6 md:w-12 md:h-7 rounded-full transition-all relative p-0.5 border",
                                    isTelegramEnabled
                                        ? "bg-sky-600 border-sky-500/50 shadow-lg shadow-sky-500/20"
                                        : "bg-slate-700 border-slate-600/50"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-all transform shadow-md",
                                    isTelegramEnabled ? "translate-x-5 md:translate-x-5" : "translate-x-0"
                                )} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6">
                    {!isTelegramConnected ? (
                        <div className="space-y-4">
                            <div className="text-center space-y-1.5 py-2">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500/10 rounded-xl flex items-center justify-center mx-auto border border-sky-500/15">
                                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-sky-400" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">Connect Telegram</p>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                    Also get contest reminders on Telegram as a backup channel.
                                </p>
                            </div>
                            <a
                                href={telegramLink}
                                target="_blank"
                                className="flex items-center justify-center gap-2 w-full bg-sky-500 hover:bg-sky-600 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg shadow-sky-500/20 text-sm md:text-base active:scale-[0.98]"
                            >
                                <Send className="w-4 h-4" />
                                Connect Telegram
                            </a>
                            <p className="text-[9px] md:text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                                Opens Telegram App · Press /start
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/15 p-3 rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs md:text-sm text-emerald-400 font-medium">Connected</span>
                                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{userData?.telegramChatId}</span>
                                <button onClick={fetchUserStatus} className="p-1 text-muted-foreground hover:text-foreground">
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="border-t border-white/5 my-1" />

                            <button
                                onClick={disconnectTelegram}
                                disabled={disconnecting}
                                className="flex items-center justify-center gap-2 w-full text-muted-foreground hover:text-destructive py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 text-xs md:text-sm hover:bg-destructive/5 active:scale-[0.98]"
                            >
                                {disconnecting ? <Spinner size="sm" /> : <Unlink className="w-3.5 h-3.5" />}
                                Disconnect Telegram
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-2 md:space-y-3"
            >
                <div className="flex items-center gap-2 px-1">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-muted-foreground">What You Get</span>
                </div>

                <div className="grid grid-cols-1 gap-2 md:gap-3">
                    {[
                        {
                            icon: Sparkles,
                            color: "blue",
                            title: "Morning Digest",
                            desc: "Daily summary of all contests at 8:00 AM IST — even on days with no contests.",
                        },
                        {
                            icon: Clock,
                            color: "purple",
                            title: "30-Min Heads Up",
                            desc: "A reminder 30 minutes before each contest starts so you never miss it.",
                        },
                        {
                            icon: Bell,
                            color: "amber",
                            title: "Multi-Channel",
                            desc: "Push notifications work like a native app. Telegram is optional backup.",
                        },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 glass p-3 md:p-4 rounded-xl md:rounded-2xl border-border">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                feature.color === "blue" && "bg-blue-500/15",
                                feature.color === "purple" && "bg-purple-500/15",
                                feature.color === "amber" && "bg-amber-500/15",
                            )}>
                                <feature.icon className={cn(
                                    "w-4 h-4",
                                    feature.color === "blue" && "text-blue-400",
                                    feature.color === "purple" && "text-purple-400",
                                    feature.color === "amber" && "text-amber-400",
                                )} />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-bold text-foreground">{feature.title}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed mt-0.5">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
