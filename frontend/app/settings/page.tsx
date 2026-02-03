"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Send, CheckCircle2, RefreshCw, AlertCircle, Unlink } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

interface UserData {
    clerkId: string;
    email: string;
    telegramChatId?: string;
    preferences: {
        email: boolean;
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

    const togglePreference = async (key: 'email' | 'telegram') => {
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
        if (!user || !confirm('Are you sure you want to disconnect Telegram? You will stop receiving Telegram notifications.')) return;

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
        <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ContestReminderBot"; // User should set this
    const telegramLink = `https://t.me/${botUsername}?start=${user?.id}`;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold font-outfit">Notification Settings</h1>
                <p className="text-slate-400">Choose how you want to be notified about upcoming contests.</p>
            </div>

            <div className="max-w-2xl mx-auto">

                {/* Telegram Notification */}
                <div className="glass p-6 rounded-3xl space-y-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-sky-500/20 p-3 rounded-2xl">
                                <Send className="w-6 h-6 text-sky-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Telegram Alerts</h3>
                                <p className="text-xs text-slate-400">Real-time instant reminders</p>
                            </div>
                        </div>
                        {userData?.telegramChatId && (
                            <button
                                onClick={() => togglePreference('telegram')}
                                disabled={updating}
                                className={cn(
                                    "w-14 h-8 rounded-full transition-all relative p-1",
                                    userData?.preferences?.telegram ? "bg-sky-600" : "bg-slate-700"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 bg-white rounded-full transition-all transform shadow-md",
                                    userData?.preferences?.telegram ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        )}
                    </div>

                    {!userData?.telegramChatId ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400">
                                You haven&apos;t linked your Telegram account yet.
                            </p>
                            <a
                                href={telegramLink}
                                target="_blank"
                                className="block w-full text-center bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-sky-500/20"
                            >
                                Connect Telegram
                            </a>
                            <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold">
                                Opens Telegram Bot
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-green-400 text-sm">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <span>Successfully linked to Telegram</span>
                                <button onClick={fetchUserStatus} className="ml-auto text-slate-400 hover:text-white">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-xl">
                                Chat ID: <span className="font-mono text-slate-400">{userData.telegramChatId}</span>
                            </div>
                            <button
                                onClick={disconnectTelegram}
                                disabled={disconnecting}
                                className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
                            >
                                {disconnecting ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <Unlink className="w-4 h-4" />
                                )}
                                Disconnect Telegram
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass p-8 rounded-3xl border-blue-500/10">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="space-y-2">
                        <h4 className="font-bold">How it works</h4>
                        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">

                            <li><b>30m Reminders:</b> A notification sent exactly 30 minutes before a contest starts.</li>
                            <li>Make sure to <b>/start</b> the Telegram bot after clicking connect.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
