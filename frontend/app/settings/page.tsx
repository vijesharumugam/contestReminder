"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Send, CheckCircle2, RefreshCw, Unlink, Bell, Clock, Sparkles, MessageSquare, Zap, Smartphone, Download, Settings, Lock, Trash2, Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import { useInstall } from "@/context/InstallContext";
import { useRouter } from "next/navigation";

interface UserData {
    _id: string;
    email: string;
    telegramChatId?: string;
    pushSubscriptions?: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
    fcmTokens?: string[];
    preferences: {
        push: boolean;
        telegram: boolean;
    };
}

export default function SettingsPage() {
    const { user, isLoaded, refreshUser, changePassword, deleteAccount } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    // Account management state
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const { platform, isInstallable, installApp, APK_DOWNLOAD_URL } = useInstall();

    const fetchUserStatus = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get(`/api/users/me`);
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

    // ===== HANDLERS =====
    const togglePushPreference = async () => {
        if (!userData || !user) return;
        setUpdating(true);
        try {
            const newPrefs = { ...userData.preferences, push: !userData.preferences.push };
            const res = await api.put(`/api/users/preferences`, {
                preferences: newPrefs,
            });
            setUserData(res.data);
        } catch (err) {
            console.error("Update failed:", err);
        } finally {
            setUpdating(false);
        }
    };

    const toggleTelegramPreference = async () => {
        if (!userData || !user) return;
        setUpdating(true);
        try {
            const newPrefs = { ...userData.preferences, telegram: !userData.preferences.telegram };
            const res = await api.put(`/api/users/preferences`, {
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
            const res = await api.post(`/api/users/disconnect-telegram`);
            setUserData(res.data);
        } catch (err) {
            console.error("Disconnect failed:", err);
            alert('Failed to disconnect Telegram. Please try again.');
        } finally {
            setDisconnecting(false);
        }
    };

    // Add App Download Section
    const renderAppDownloadSection = () => {
        if (platform === 'native') return null;

        // Show section if installable OR if we want to offer APK download (Android/Desktop fallback)
        const showSection = isInstallable || platform === 'android' || platform === 'desktop';
        if (!showSection) return null;

        const isAPKDownload = platform === 'android' || (platform === 'desktop' && !isInstallable);

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 }}
                className="glass rounded-2xl md:rounded-3xl overflow-hidden mb-4 md:mb-6"
            >
                <div className="relative px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/15 to-pink-600/20 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="bg-violet-500/25 p-1.5 md:p-2 rounded-lg md:rounded-xl border border-violet-500/20">
                                <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm md:text-base text-foreground">Get the App</h3>
                                    <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full border border-violet-500/20">Recommended</span>
                                </div>
                                <p className="text-[10px] md:text-xs text-violet-300/60 leading-tight">Install for the best experience</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h4 className="font-bold text-foreground text-sm md:text-base">
                                {isAPKDownload ? 'Download for Android' : platform === 'ios' ? 'Install on iOS' : 'Install Desktop App'}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {isAPKDownload
                                    ? 'Get our native app for better performance and reliable background notifications.'
                                    : platform === 'ios'
                                        ? 'Add to Home Screen to enjoy full-screen experience and easy access.'
                                        : 'Install as a desktop app for quick access from your taskbar/dock.'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (isAPKDownload) {
                                    window.open(APK_DOWNLOAD_URL, '_blank');
                                } else {
                                    installApp();
                                }
                            }}
                            className="w-full md:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs md:text-sm whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            {isAPKDownload ? 'Download APK' : platform === 'ios' ? 'Show Instructions' : 'Install App'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (loading) return (
        <AuthGuard>
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Loading settings...</p>
                </div>
            </div>
        </AuthGuard>
    );

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ContestReminderBot";
    const telegramLink = `https://t.me/${botUsername}?start=${user?._id}`;
    const isTelegramConnected = !!userData?.telegramChatId;
    const isTelegramEnabled = userData?.preferences?.telegram;
    const isNativeApp = platform === 'native';
    const hasFcmToken = (userData?.fcmTokens?.length ?? 0) > 0;

    return (
        <AuthGuard>
            <div className="max-w-lg mx-auto space-y-4 md:space-y-6">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-500/15 rounded-lg">
                            <Settings className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-blue-400">Settings</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold font-outfit text-foreground">Notifications</h1>
                    <p className="text-muted-foreground text-xs md:text-sm">Manage your alert preferences</p>
                </motion.div>

                {/* App Download Section (Only for Web/PWA) */}
                {renderAppDownloadSection()}

                {/* ======= NATIVE APP NOTIFICATIONS (Only valid on Native App) ======= */}
                {isNativeApp && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="glass rounded-2xl md:rounded-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/15 to-violet-600/20 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 md:gap-3">
                                    <div className="bg-fuchsia-500/25 p-1.5 md:p-2 rounded-lg md:rounded-xl border border-fuchsia-500/20">
                                        <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4 text-fuchsia-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-sm md:text-base text-foreground">App Notifications</h3>
                                            <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded-full border border-fuchsia-500/20">Active</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-fuchsia-300/60 leading-tight">Managed by your device settings</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 space-y-3">
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/15 p-3 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs md:text-sm text-emerald-400 font-medium">Native notifications active</p>
                                        {hasFcmToken && (
                                            <p className="text-[10px] text-zinc-500">Device Registered</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={togglePushPreference}
                                    disabled={updating}
                                    className={cn(
                                        "w-11 h-6 md:w-12 md:h-7 rounded-full transition-all relative p-0.5 border flex-shrink-0",
                                        userData?.preferences?.push
                                            ? "bg-fuchsia-600 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20"
                                            : "bg-slate-700 border-slate-600/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-all transform shadow-md",
                                        userData?.preferences?.push ? "translate-x-5 md:translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                You can also mute notifications from your device settings.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ======= TELEGRAM (Primary for Web, Optional for App) ======= */}
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
                                        <span className={cn(
                                            "text-[8px] md:text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full border",
                                            isNativeApp
                                                ? "bg-muted text-muted-foreground border-border"
                                                : "bg-sky-500/20 text-sky-400 border-sky-500/20"
                                        )}>
                                            {isNativeApp ? "Optional" : "Recommended"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-sky-300/60 leading-tight">Get reminders on Telegram</p>
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
                                        {isNativeApp
                                            ? "Also get contest reminders on Telegram as a backup."
                                            : "Receive instant alerts for upcoming contests directly in Telegram."}
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
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 glass p-3 md:p-4 rounded-xl md:rounded-2xl border-border">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                    feature.color === "blue" && "bg-blue-500/15",
                                    feature.color === "purple" && "bg-purple-500/15",
                                )}>
                                    <feature.icon className={cn(
                                        "w-4 h-4",
                                        feature.color === "blue" && "text-blue-400",
                                        feature.color === "purple" && "text-purple-400",
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

                {/* ==================== ACCOUNT & SECURITY ==================== */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4 md:space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/15 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold font-outfit">Account & Security</h2>
                            <p className="text-[10px] md:text-xs text-muted-foreground">Manage your password and account settings</p>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl border-border space-y-4">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm md:text-base font-bold">Change Password</h3>
                        </div>

                        <AnimatePresence>
                            {passwordMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-medium text-center border",
                                        passwordMessage.type === 'success'
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}
                                >
                                    {passwordMessage.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setPasswordMessage(null);

                                if (passwordForm.new !== passwordForm.confirm) {
                                    setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
                                    return;
                                }
                                if (passwordForm.new.length < 6) {
                                    setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
                                    return;
                                }

                                setPasswordLoading(true);
                                const result = await changePassword(passwordForm.current, passwordForm.new);
                                setPasswordLoading(false);

                                if (result.success) {
                                    setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
                                    setPasswordForm({ current: "", new: "", confirm: "" });
                                    setTimeout(() => setPasswordMessage(null), 3000);
                                } else {
                                    setPasswordMessage({ type: 'error', text: result.error || 'Failed to change password.' });
                                }
                            }}
                            className="space-y-3"
                        >
                            <div className="space-y-1.5">
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                        required
                                        className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                        required
                                        minLength={6}
                                        className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm}
                                    onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                    required
                                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
                                    placeholder="Re-enter new password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordLoading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {passwordLoading ? <Spinner size="sm" className="text-white" /> : <Lock className="w-4 h-4" />}
                                Update Password
                            </button>
                        </form>
                    </div>

                    {/* Danger Zone - Delete Account */}
                    <div className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl border border-red-500/20 space-y-3">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <h3 className="text-sm md:text-base font-bold text-red-400">Danger Zone</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 px-4 rounded-xl transition-all text-xs border border-red-500/20 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </button>

                        {/* Delete Confirmation Dialog */}
                        <AnimatePresence>
                            {showDeleteDialog && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setShowDeleteDialog(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0.95 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="glass p-6 rounded-3xl border border-red-500/20 w-full max-w-sm space-y-4"
                                    >
                                        <div className="text-center">
                                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                            <h3 className="text-lg font-bold text-red-400">Delete Your Account?</h3>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                This will permanently delete your account, notification subscriptions, and all settings. Enter your password to confirm.
                                            </p>
                                        </div>

                                        {deleteError && (
                                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-2 text-xs text-center">
                                                {deleteError}
                                            </div>
                                        )}

                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                                            placeholder="Enter your password"
                                            className="w-full bg-muted/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500/50 transition-colors"
                                        />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setShowDeleteDialog(false); setDeletePassword(""); setDeleteError(""); }}
                                                className="flex-1 bg-muted/50 hover:bg-muted text-foreground font-bold py-3 rounded-xl transition-all text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!deletePassword) { setDeleteError("Password is required"); return; }
                                                    setDeleteLoading(true);
                                                    const result = await deleteAccount(deletePassword);
                                                    setDeleteLoading(false);
                                                    if (result.success) {
                                                        router.push("/sign-in");
                                                    } else {
                                                        setDeleteError(result.error || "Failed to delete account");
                                                    }
                                                }}
                                                disabled={deleteLoading || !deletePassword}
                                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {deleteLoading ? <Spinner size="sm" className="text-white" /> : <Trash2 className="w-4 h-4" />}
                                                Delete Forever
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AuthGuard>
    );
}
