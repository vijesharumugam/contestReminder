"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    Eye,
    EyeOff,
    Lock,
    MessageSquare,
    RefreshCw,
    Send,
    Settings as SettingsIcon,
    Smartphone,
    Trash2,
    Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useInstall } from "@/context/InstallContext";
import AuthGuard from "@/components/AuthGuard";
import { Spinner } from "@/components/Spinner";

interface UserData {
    _id: string;
    email: string;
    telegramChatId?: string;
    fcmTokens?: string[];
    preferences: {
        push: boolean;
        telegram: boolean;
    };
}

const Toggle = ({
    checked,
    disabled,
    onClick,
    ariaLabel,
}: {
    checked: boolean;
    disabled?: boolean;
    onClick: () => void;
    ariaLabel: string;
}) => (
    <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
        className={cn(
            "relative h-6 w-11 rounded-full border p-0.5 transition-colors",
            checked ? "border-primary/45 bg-primary" : "border-border bg-muted",
            disabled && "cursor-not-allowed opacity-60",
        )}
    >
        <span
            className={cn(
                "block h-5 w-5 rounded-full bg-white shadow transition-transform",
                checked ? "translate-x-5" : "translate-x-0",
            )}
        />
    </button>
);

export default function SettingsPage() {
    const { user, isLoaded, changePassword, deleteAccount } = useAuth();
    const { platform, isInstallable, installApp, APK_DOWNLOAD_URL } = useInstall();
    const router = useRouter();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [telegramLink, setTelegramLink] = useState("");
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
    const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const isNative = platform === "native";
    const isTelegramConnected = Boolean(userData?.telegramChatId);
    const hasFcmToken = (userData?.fcmTokens?.length || 0) > 0;
    const showInstallCard = !isNative && (isInstallable || platform === "android" || platform === "desktop" || platform === "ios");

    const installMeta = useMemo(() => {
        const isApk = platform === "android" || (platform === "desktop" && !isInstallable);
        if (isApk) {
            return {
                title: "Download Android app",
                description: "Install the app for better background reliability and notification delivery.",
                cta: "Download APK",
                onClick: () => window.open(APK_DOWNLOAD_URL, "_blank"),
            };
        }
        if (platform === "ios") {
            return {
                title: "Install on iOS",
                description: "Use Add to Home Screen to run ContestRemind as an app on iPhone or iPad.",
                cta: "Show install steps",
                onClick: () => installApp(),
            };
        }
        return {
            title: "Install desktop app",
            description: "Pin ContestRemind as a desktop app for faster access and better engagement.",
            cta: "Install app",
            onClick: () => installApp(),
        };
    }, [APK_DOWNLOAD_URL, installApp, isInstallable, platform]);

    const fetchUserStatus = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get("/api/users/me");
            setUserData(res.data);
        } catch (error) {
            console.error("Error fetching user status:", error);
            setStatusMessage({ type: "error", text: "Could not load settings. Please refresh." });
        } finally {
            setLoading(false);
        }
    }, [user]);

    const loadTelegramLink = useCallback(async () => {
        if (!user) return;
        try {
            const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ContestReminderBot";
            const res = await api.get("/api/users/telegram/connect-token");
            setTelegramLink(`https://t.me/${botUsername}?start=${res.data.token}`);
        } catch (error) {
            console.error("Failed to generate Telegram connect link:", error);
            setTelegramLink("");
        }
    }, [user]);

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserStatus();
            loadTelegramLink();
        }
    }, [isLoaded, user, fetchUserStatus, loadTelegramLink]);

    const updatePreferences = async (nextPreferences: UserData["preferences"]) => {
        if (!userData) return;
        setUpdating(true);
        setStatusMessage(null);
        try {
            const res = await api.put("/api/users/preferences", { preferences: nextPreferences });
            setUserData(res.data);
            setStatusMessage({ type: "success", text: "Notification preferences updated." });
        } catch (error) {
            console.error("Preference update failed:", error);
            setStatusMessage({ type: "error", text: "Could not update preferences." });
        } finally {
            setUpdating(false);
        }
    };

    const disconnectTelegram = async () => {
        if (!confirm("Disconnect Telegram notifications for this account?")) return;
        setDisconnecting(true);
        setStatusMessage(null);
        try {
            const res = await api.post("/api/users/disconnect-telegram");
            setUserData(res.data);
            setStatusMessage({ type: "success", text: "Telegram disconnected successfully." });
            loadTelegramLink();
        } catch (error) {
            console.error("Failed to disconnect Telegram:", error);
            setStatusMessage({ type: "error", text: "Could not disconnect Telegram." });
        } finally {
            setDisconnecting(false);
        }
    };

    const onSubmitPassword = async (event: React.FormEvent) => {
        event.preventDefault();
        setPasswordMessage(null);

        if (passwordForm.next !== passwordForm.confirm) {
            setPasswordMessage({ type: "error", text: "New passwords do not match." });
            return;
        }
        if (passwordForm.next.length < 6) {
            setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
            return;
        }

        setPasswordLoading(true);
        const result = await changePassword(passwordForm.current, passwordForm.next);
        setPasswordLoading(false);

        if (result.success) {
            setPasswordForm({ current: "", next: "", confirm: "" });
            setPasswordMessage({ type: "success", text: "Password updated successfully." });
        } else {
            setPasswordMessage({ type: "error", text: result.error || "Failed to change password." });
        }
    };

    const onDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Password is required.");
            return;
        }
        setDeleteLoading(true);
        const result = await deleteAccount(deletePassword);
        setDeleteLoading(false);

        if (result.success) {
            router.push("/sign-in");
            return;
        }

        setDeleteError(result.error || "Failed to delete account.");
    };

    if (loading) {
        return (
            <AuthGuard>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="mx-auto max-w-4xl space-y-5 pb-8">
                <section className="glass rounded-2xl p-5 md:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Account Settings</p>
                    <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
                        <SettingsIcon className="h-6 w-6 text-primary" />
                        Preferences and security
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage reminder channels, app installation, password, and account access.
                    </p>
                </section>

                {statusMessage && (
                    <div
                        className={cn(
                            "rounded-xl border px-4 py-2.5 text-sm",
                            statusMessage.type === "success"
                                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                : "border-destructive/35 bg-destructive/10 text-destructive",
                        )}
                    >
                        {statusMessage.text}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    {showInstallCard && (
                        <section className="glass rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl border border-border bg-muted/65 p-2.5">
                                    <Download className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-base font-bold text-foreground">{installMeta.title}</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">{installMeta.description}</p>
                                    <button
                                        type="button"
                                        onClick={installMeta.onClick}
                                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        <Smartphone className="h-4 w-4" />
                                        {installMeta.cta}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="glass rounded-2xl p-5">
                        <h2 className="text-base font-bold text-foreground">Notification channels</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Control reminder delivery to mobile app and Telegram.
                        </p>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-xl border border-border bg-background/65 p-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">App notifications</p>
                                    <p className="text-xs text-muted-foreground">
                                        {hasFcmToken
                                            ? "Device registered for native push notifications."
                                            : "Enable now to receive app reminders after device registration."}
                                    </p>
                                </div>
                                <Toggle
                                    checked={Boolean(userData?.preferences.push)}
                                    disabled={updating}
                                    onClick={() =>
                                        userData && updatePreferences({ ...userData.preferences, push: !userData.preferences.push })
                                    }
                                    ariaLabel="Toggle app notifications"
                                />
                            </div>

                            <div className="rounded-xl border border-border bg-background/65 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground">Telegram</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {isTelegramConnected
                                                ? `Connected: ${userData?.telegramChatId}`
                                                : "Connect Telegram to receive reminder messages."}
                                        </p>
                                    </div>
                                    {isTelegramConnected && (
                                        <Toggle
                                            checked={Boolean(userData?.preferences.telegram)}
                                            disabled={updating}
                                            onClick={() =>
                                                userData && updatePreferences({ ...userData.preferences, telegram: !userData.preferences.telegram })
                                            }
                                            ariaLabel="Toggle Telegram notifications"
                                        />
                                    )}
                                </div>

                                {!isTelegramConnected ? (
                                    telegramLink ? (
                                        <a
                                            href={telegramLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/12 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Connect Telegram
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={loadTelegramLink}
                                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Refresh connect link
                                        </button>
                                    )
                                ) : (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={fetchUserStatus}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Refresh status
                                        </button>
                                        <button
                                            type="button"
                                            disabled={disconnecting}
                                            onClick={disconnectTelegram}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/35 bg-destructive/8 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/14 disabled:opacity-60"
                                        >
                                            {disconnecting ? <Spinner size="sm" /> : <Unlink className="h-3.5 w-3.5" />}
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                                <p className="inline-flex items-center gap-1.5 font-semibold">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Active reminders
                                </p>
                                <p className="mt-1">
                                    Daily digest at 08:00 IST and pre-start reminder about 30 minutes before contest time.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="glass rounded-2xl p-5 md:p-6">
                    <h2 className="text-base font-bold text-foreground">Security</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Update your password and manage account access.</p>

                    {passwordMessage && (
                        <div
                            className={cn(
                                "mt-4 rounded-xl border px-4 py-2 text-sm",
                                passwordMessage.type === "success"
                                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                    : "border-destructive/35 bg-destructive/10 text-destructive",
                            )}
                        >
                            {passwordMessage.text}
                        </div>
                    )}

                    <form onSubmit={onSubmitPassword} className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-1.5 md:col-span-2">
                            <span className="text-xs font-semibold text-foreground">Current password</span>
                            <div className="relative">
                                <input
                                    type={showPassword.current ? "text" : "password"}
                                    required
                                    value={passwordForm.current}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/45"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground">New password</span>
                            <div className="relative">
                                <input
                                    type={showPassword.next ? "text" : "password"}
                                    required
                                    value={passwordForm.next}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/45"
                                    placeholder="Minimum 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {showPassword.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground">Confirm new password</span>
                            <div className="relative">
                                <input
                                    type={showPassword.confirm ? "text" : "password"}
                                    required
                                    value={passwordForm.confirm}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/45"
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </label>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={
                                    passwordLoading ||
                                    !passwordForm.current ||
                                    !passwordForm.next ||
                                    !passwordForm.confirm
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {passwordLoading ? <Spinner size="sm" /> : <Lock className="h-4 w-4" />}
                                Update password
                            </button>
                        </div>
                    </form>
                </section>

                <section className="glass rounded-2xl border border-destructive/35 p-5 md:p-6">
                    <h2 className="inline-flex items-center gap-2 text-base font-bold text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Danger zone
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Permanently delete this account and all associated settings. This action cannot be undone.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowDeleteDialog(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/18"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete account
                    </button>
                </section>

                {showDeleteDialog && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        onClick={() => {
                            setShowDeleteDialog(false);
                            setDeletePassword("");
                            setDeleteError("");
                        }}
                    >
                        <div
                            className="glass w-full max-w-md rounded-2xl border border-destructive/35 p-5"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-foreground">Delete account</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Enter your password to confirm permanent account deletion.
                            </p>

                            {deleteError && (
                                <div className="mt-3 rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {deleteError}
                                </div>
                            )}

                            <label className="mt-4 block space-y-1.5">
                                <span className="text-xs font-semibold text-foreground">Password</span>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(event) => {
                                        setDeletePassword(event.target.value);
                                        setDeleteError("");
                                    }}
                                    placeholder="Enter password"
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/45"
                                />
                            </label>

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteDialog(false);
                                        setDeletePassword("");
                                        setDeleteError("");
                                    }}
                                    className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={deleteLoading || !deletePassword}
                                    onClick={onDeleteAccount}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-3 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleteLoading ? <Spinner size="sm" className="text-destructive-foreground" /> : <Trash2 className="h-4 w-4" />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}
