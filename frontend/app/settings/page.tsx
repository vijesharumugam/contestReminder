"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Send, CheckCircle2, RefreshCw, AlertCircle, Unlink, Bell, Clock, Sparkles, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UserData {
    clerkId: string;
    email: string;
    telegramChatId?: string;
    preferences: {
        telegram: boolean;
    };
}

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const fetchUserStatus = useCallback(async () => {
        if (!user) return;
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.get(`${backendUrl}/api/users/${user.id}`);
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

    const togglePreference = async (key: 'telegram') => {
        if (!userData || !user) return;
        setUpdating(true);
        try {
            const newPrefs = { ...userData.preferences, [key]: !userData.preferences[key] };
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.put(`${backendUrl}/api/users/preferences`, {
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
        if (!user || !confirm('Are you sure you want to disconnect Telegram? You will stop receiving notifications.')) return;

        setDisconnecting(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/users/disconnect-telegram`, {
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
    const isConnected = !!userData?.telegramChatId;
    const isEnabled = userData?.preferences?.telegram;

    return (
        <div className="max-w-lg mx-auto space-y-4 md:space-y-6">
            {/* Page Header with user info */}
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
                <h1 className="text-2xl md:text-3xl font-bold font-outfit">Settings</h1>
                <p className="text-slate-500 text-xs md:text-sm">Manage your notification preferences</p>
            </motion.div>

            {/* Connection Status Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={cn(
                    "p-3 md:p-4 rounded-2xl flex items-center gap-3 border",
                    isConnected
                        ? "bg-emerald-500/5 border-emerald-500/15"
                        : "bg-amber-500/5 border-amber-500/15"
                )}
            >
                <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isConnected ? "bg-emerald-500/15" : "bg-amber-500/15"
                )}>
                    {isConnected ? (
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "text-xs md:text-sm font-bold",
                        isConnected ? "text-emerald-400" : "text-amber-400"
                    )}>
                        {isConnected ? "Telegram Connected" : "Telegram Not Connected"}
                    </p>
                    <p className="text-[10px] md:text-xs text-slate-500 truncate">
                        {isConnected ? `Chat ID: ${userData?.telegramChatId}` : "Link your account to receive reminders"}
                    </p>
                </div>
                {isConnected && (
                    <button onClick={fetchUserStatus} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </motion.div>

            {/* Main Telegram Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl md:rounded-3xl overflow-hidden"
            >
                {/* Card Header with gradient */}
                <div className="relative px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-sky-600/20 via-blue-600/15 to-indigo-600/20 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-sky-500/25 p-2 md:p-2.5 rounded-xl border border-sky-500/20">
                                <Send className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm md:text-base text-white">Telegram Alerts</h3>
                                <p className="text-[10px] md:text-xs text-sky-300/60">Instant push notifications</p>
                            </div>
                        </div>
                        {isConnected && (
                            <button
                                onClick={() => togglePreference('telegram')}
                                disabled={updating}
                                className={cn(
                                    "w-11 h-6 md:w-12 md:h-7 rounded-full transition-all relative p-0.5 border",
                                    isEnabled
                                        ? "bg-sky-600 border-sky-500/50 shadow-lg shadow-sky-500/20"
                                        : "bg-slate-700 border-slate-600/50"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-all transform shadow-md",
                                    isEnabled ? "translate-x-5 md:translate-x-5" : "translate-x-0"
                                )} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-4 md:p-6">
                    {!isConnected ? (
                        <div className="space-y-4">
                            <div className="text-center space-y-2 py-2">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/15">
                                    <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-sky-400" />
                                </div>
                                <p className="text-sm md:text-base font-semibold text-white">Connect Your Telegram</p>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                    Link your Telegram account to receive daily contest digests and 30-minute reminders before contests start.
                                </p>
                            </div>
                            <a
                                href={telegramLink}
                                target="_blank"
                                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg shadow-sky-500/20 text-sm md:text-base active:scale-[0.98]"
                            >
                                <Send className="w-4 h-4" />
                                Connect Telegram
                            </a>
                            <p className="text-[9px] md:text-[10px] text-center text-slate-600 uppercase tracking-widest font-bold">
                                Opens Telegram App
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Active features when connected */}
                            <div className="space-y-2">
                                <div className={cn(
                                    "flex items-center gap-3 p-2.5 md:p-3 rounded-xl transition-colors",
                                    isEnabled ? "bg-white/5" : "bg-white/[0.02] opacity-50"
                                )}>
                                    <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs md:text-sm font-semibold text-white">Daily Digest</p>
                                        <p className="text-[10px] md:text-xs text-slate-500">Every morning at 8:00 AM IST</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-3 p-2.5 md:p-3 rounded-xl transition-colors",
                                    isEnabled ? "bg-white/5" : "bg-white/[0.02] opacity-50"
                                )}>
                                    <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs md:text-sm font-semibold text-white">30-Min Reminders</p>
                                        <p className="text-[10px] md:text-xs text-slate-500">Alert before contest starts</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/5 my-1" />

                            {/* Disconnect button - subtle, not alarming */}
                            <button
                                onClick={disconnectTelegram}
                                disabled={disconnecting}
                                className="flex items-center justify-center gap-2 w-full text-slate-400 hover:text-red-400 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 text-xs md:text-sm hover:bg-red-500/5 active:scale-[0.98]"
                            >
                                {disconnecting ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <Unlink className="w-3.5 h-3.5" />
                                )}
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
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-slate-500">What You Get</span>
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
                            desc: "A reminder 30 minutes before each contest starts so you never miss the registration.",
                        },
                        {
                            icon: Bell,
                            color: "amber",
                            title: "Welcome Summary",
                            desc: "When you first connect, you'll get a summary of contests in the next 3 days.",
                        },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 glass p-3 md:p-4 rounded-xl md:rounded-2xl border-white/5">
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
                                <p className="text-xs md:text-sm font-bold text-white">{feature.title}</p>
                                <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed mt-0.5">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
