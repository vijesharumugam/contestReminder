"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";
import { Users, Send, Lock, LayoutDashboard, CheckCircle, AlertCircle, ShieldAlert, X, Bell } from "lucide-react";
import { Spinner } from "@/components/Spinner";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";

// Toast notification types
interface Toast {
    id: string;
    type: 'success' | 'error';
    title: string;
    message: string;
}

// Test status tracking for individual users
interface TestStatus {
    [key: string]: {
        type: 'success' | 'error';
        message: string;
        timestamp: number;
    };
}

interface User {
    _id: string;
    clerkId: string;
    email: string;
    telegramChatId?: string;
    pushSubscriptions?: unknown[];
    preferences: {
        push?: boolean;
        telegram: boolean;
    };
}

export default function AdminPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [testLoading, setTestLoading] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);


    const [testStatuses, setTestStatuses] = useState<TestStatus>({});
    const isAdmin = useMemo(() => {
        return isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;
    }, [isLoaded, isSignedIn, user]);

    // Toast notification helper functions
    const addToast = (type: 'success' | 'error', title: string, message: string) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, type, title, message };
        setToasts(prev => [...prev, newToast]);

        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Update test status for a specific user/test type
    const updateTestStatus = (key: string, type: 'success' | 'error', message: string) => {
        setTestStatuses(prev => ({
            ...prev,
            [key]: { type, message, timestamp: Date.now() }
        }));

        // Auto-clear status after 10 seconds
        setTimeout(() => {
            setTestStatuses(prev => {
                const updated = { ...prev };
                if (updated[key]?.timestamp <= Date.now() - 9000) {
                    delete updated[key];
                }
                return updated;
            });
        }, 10000);
    };

    const fetchUsers = useCallback(async () => {
        if (!isAdmin) {
            console.log("Not admin, skipping fetch");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await api.get(`/api/admin/users`, {
                headers: { 'x-admin-email': ADMIN_EMAIL }
            });
            console.log("Users fetched:", res.data);
            setUsers(res.data);
        } catch (err: unknown) {
            console.error("Failed to fetch users:", err);
            if (axios.isAxiosError(err)) {
                setError(`Failed to fetch users: ${err.response?.data?.error || err.message}`);
            } else {
                setError("An unexpected error occurred while fetching users");
            }
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        if (isLoaded && isAdmin) {
            fetchUsers();
        }
    }, [isLoaded, isAdmin, fetchUsers]);

    const testTelegram = async (chatId: string, userId: string) => {
        if (!chatId) return;
        const statusKey = `tg-${userId}`;
        setTestLoading(statusKey);
        try {
            await api.post(`/api/admin/test-telegram`,
                { chatId },
                { headers: { 'x-admin-email': ADMIN_EMAIL } }
            );
            addToast('success', 'Telegram Sent! 📱', `Test message successfully delivered to chat ID: ${chatId}`);
            updateTestStatus(statusKey, 'success', 'Sent!');
        } catch {
            addToast('error', 'Telegram Failed', `Could not send message to chat ID: ${chatId}`);
            updateTestStatus(statusKey, 'error', 'Failed');
        } finally {
            setTestLoading(null);
        }
    };

    const testPush = async (userId: string) => {
        const statusKey = `push-${userId}`;
        setTestLoading(statusKey);
        try {
            await api.post(`/api/admin/test-push`,
                { userId },
                { headers: { 'x-admin-email': ADMIN_EMAIL } }
            );
            addToast('success', 'Push Sent! 🔔', `Test push notification sent successfully`);
            updateTestStatus(statusKey, 'success', 'Sent!');
        } catch {
            addToast('error', 'Push Failed', `Could not send push notification`);
            updateTestStatus(statusKey, 'error', 'Failed');
        } finally {
            setTestLoading(null);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Spinner size="lg" className="text-blue-500" />
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="glass p-8 rounded-3xl w-full max-w-md text-center space-y-6">
                    <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold font-outfit text-foreground">Admin Portal</h1>
                        <p className="text-muted-foreground text-sm">Please sign in to access the master dashboard.</p>
                    </div>
                    <SignInButton mode="modal">
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25">
                            Sign In as Admin
                        </button>
                    </SignInButton>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="glass p-8 rounded-3xl w-full max-w-md text-center space-y-6 border-red-500/20">
                    <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold font-outfit text-red-500">Access Denied</h1>
                        <p className="text-slate-400">You do not have administrative privileges to view this page.</p>
                        <div className="bg-slate-800/50 p-3 rounded-xl mt-4 text-xs font-mono text-slate-500">
                            Logged in as: {user?.primaryEmailAddress?.emailAddress}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link href="/" className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all">
                            Back to Home
                        </Link>
                        <SignOutButton>
                            <button className="block w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl transition-all border border-red-500/20">
                                Sign Out / Switch Account
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Toast Notifications Container */}
            <div className="fixed top-20 right-3 left-3 md:left-auto md:right-4 md:top-4 z-50 flex flex-col gap-3 md:max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            animate-slide-in-right p-3 md:p-4 rounded-2xl shadow-2xl backdrop-blur-xl border
                            flex items-start gap-3
                            ${toast.type === 'success'
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : 'bg-red-500/20 border-red-500/30 text-red-400'
                            }
                        `}
                    >
                        <div className={`
                            w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                            ${toast.type === 'success' ? 'bg-green-500/30' : 'bg-red-500/30'}
                        `}>
                            {toast.type === 'success'
                                ? <CheckCircle className="w-5 h-5" />
                                : <AlertCircle className="w-5 h-5" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm">{toast.title}</div>
                            <div className="text-xs opacity-80 mt-0.5 break-words">{toast.message}</div>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-4 md:space-y-8 overflow-x-hidden">
                {/* Header — compact on mobile */}
                <div className="flex flex-col gap-3 md:gap-4 border-b border-slate-800 pb-4 md:pb-8">
                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-3 md:gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl md:text-4xl font-bold font-outfit flex items-center gap-2 md:gap-3">
                                <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                                Dashboard
                            </h1>
                            <p className="text-muted-foreground text-xs md:text-base">{users.length} active users</p>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 bg-green-500/10 border border-green-500/20 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-green-400 text-[10px] md:text-xs font-medium">
                            <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[200px] md:max-w-none">Admin: {user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    </div>
                </div>

                {/* User Directory */}
                <div className="glass rounded-2xl md:rounded-3xl overflow-hidden border-blue-500/10">
                    <div className="px-4 py-3 md:p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                        <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="md:hidden">Members</span>
                            <span className="hidden md:inline">User Directory</span>
                        </h3>
                        <button onClick={fetchUsers} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                            {loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                    </div>

                    {error && (
                        <div className="mx-3 md:mx-6 my-3 md:my-4 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 text-red-500 text-xs md:text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 min-w-0 break-words">{error}</span>
                            <button onClick={fetchUsers} className="underline font-bold flex-shrink-0">Retry</button>
                        </div>
                    )}

                    {/* ===== MOBILE: Card Layout ===== */}
                    <div className="md:hidden divide-y divide-border/50">
                        {users.map((u) => {
                            const userName = u.email.split('@')[0].replace(/[._]/g, ' ');
                            const initials = userName.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 2);
                            const hasPush = (u.pushSubscriptions?.length ?? 0) > 0;
                            const hasTelegram = !!u.telegramChatId;

                            return (
                                <div key={u._id} className="p-4 space-y-3">
                                    {/* User Info Row */}
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-border flex items-center justify-center flex-shrink-0 text-primary">
                                            <span className="text-xs font-bold">{initials}</span>
                                        </div>
                                        {/* Name & Notification Status */}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm text-foreground truncate capitalize">{userName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {/* Push status dot */}
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-1 h-1 rounded-full ${hasPush ? 'bg-blue-400' : 'bg-muted-foreground'}`} />
                                                    <span className={`text-[9px] ${hasPush ? 'text-blue-400' : 'text-muted-foreground'}`}>Notifications</span>
                                                </div>
                                                <span className="text-muted-foreground text-[9px]">•</span>
                                                {/* Telegram status dot */}
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-1 h-1 rounded-full ${hasTelegram ? 'bg-sky-400' : 'bg-muted-foreground'}`} />
                                                    <span className={`text-[9px] ${hasTelegram ? 'text-sky-400' : 'text-muted-foreground'}`}>Telegram</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pl-[52px]">
                                        {/* Send Push Notification */}
                                        <button
                                            onClick={() => testPush(u._id)}
                                            disabled={!hasPush || !!testLoading}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all border text-[10px] font-semibold disabled:opacity-20 active:scale-[0.97]
                                                ${hasPush
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                                    : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                                                }
                                                ${testStatuses[`push-${u._id}`]?.type === 'success' ? '!bg-green-500/10 !border-green-500/20 !text-green-400' : ''}
                                                ${testStatuses[`push-${u._id}`]?.type === 'error' ? '!bg-red-500/10 !border-red-500/20 !text-red-400' : ''}
                                            `}
                                        >
                                            {testLoading === `push-${u._id}` ? (
                                                <Spinner size="sm" />
                                            ) : testStatuses[`push-${u._id}`]?.type === 'success' ? (
                                                <CheckCircle className="w-3 h-3" />
                                            ) : testStatuses[`push-${u._id}`]?.type === 'error' ? (
                                                <AlertCircle className="w-3 h-3" />
                                            ) : (
                                                <Bell className="w-3 h-3" />
                                            )}
                                            {testStatuses[`push-${u._id}`]?.type === 'success' ? 'Sent!' :
                                                testStatuses[`push-${u._id}`]?.type === 'error' ? 'Failed' : 'Notify'}
                                        </button>

                                        {/* Send Telegram Message */}
                                        <button
                                            onClick={() => testTelegram(u.telegramChatId!, u._id)}
                                            disabled={!hasTelegram || !!testLoading}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all border text-[10px] font-semibold disabled:opacity-20 active:scale-[0.97]
                                                ${hasTelegram
                                                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20'
                                                    : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                                                }
                                                ${testStatuses[`tg-${u._id}`]?.type === 'success' ? '!bg-green-500/10 !border-green-500/20 !text-green-400' : ''}
                                                ${testStatuses[`tg-${u._id}`]?.type === 'error' ? '!bg-red-500/10 !border-red-500/20 !text-red-400' : ''}
                                            `}
                                        >
                                            {testLoading === `tg-${u._id}` ? (
                                                <Spinner size="sm" />
                                            ) : testStatuses[`tg-${u._id}`]?.type === 'success' ? (
                                                <CheckCircle className="w-3 h-3" />
                                            ) : testStatuses[`tg-${u._id}`]?.type === 'error' ? (
                                                <AlertCircle className="w-3 h-3" />
                                            ) : (
                                                <Send className="w-3 h-3" />
                                            )}
                                            {testStatuses[`tg-${u._id}`]?.type === 'success' ? 'Sent!' :
                                                testStatuses[`tg-${u._id}`]?.type === 'error' ? 'Failed' : 'Message'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {!loading && users.length === 0 && (
                            <div className="px-4 py-16 text-center text-muted-foreground text-sm">
                                No members yet
                            </div>
                        )}
                    </div>

                    {/* ===== DESKTOP: Table Layout ===== */}
                    <div className="hidden md:block">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-8 py-4">User Details</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Quick Tests</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((u) => (
                                    <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-foreground">{u.email}</div>
                                            <div className="text-xs text-muted-foreground mt-1 font-mono">{u.clerkId}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.pushSubscriptions && u.pushSubscriptions.length > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                    Push ({u.pushSubscriptions?.length || 0})
                                                </span>
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.telegramChatId ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                    Telegram
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-3 items-center">
                                                {/* Push Test Button */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => testPush(u._id)}
                                                        disabled={!u.pushSubscriptions?.length || !!testLoading}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border disabled:opacity-20 text-xs font-bold ${u.pushSubscriptions?.length ? 'bg-muted hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20 border-border' : 'bg-muted border-border cursor-not-allowed'}`}
                                                    >
                                                        {testLoading === `push-${u._id}` ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                                                        Test Push
                                                    </button>
                                                    {testStatuses[`push-${u._id}`] && (
                                                        <span className={`
                                                            animate-fade-in px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1
                                                            ${testStatuses[`push-${u._id}`].type === 'success'
                                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                            }
                                                        `}>
                                                            {testStatuses[`push-${u._id}`].type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                            {testStatuses[`push-${u._id}`].message}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Telegram Test Button */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => testTelegram(u.telegramChatId!, u._id)}
                                                        disabled={!u.telegramChatId || !!testLoading}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border disabled:opacity-20 text-xs font-bold ${u.telegramChatId ? 'bg-muted hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/20 border-border' : 'bg-muted border-border cursor-not-allowed'}`}
                                                    >
                                                        {testLoading === `tg-${u._id}` ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                                                        Test TG
                                                    </button>
                                                    {testStatuses[`tg-${u._id}`] && (
                                                        <span className={`
                                                            animate-fade-in px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1
                                                            ${testStatuses[`tg-${u._id}`].type === 'success'
                                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                            }
                                                        `}>
                                                            {testStatuses[`tg-${u._id}`].type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                            {testStatuses[`tg-${u._id}`].message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center text-muted-foreground italic">
                                            No users detected in the matrix.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
