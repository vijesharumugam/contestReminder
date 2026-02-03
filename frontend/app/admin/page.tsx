"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";
import { Users, Mail, Send, Lock, LayoutDashboard, CheckCircle, AlertCircle, ShieldAlert, X } from "lucide-react";
import { Spinner } from "@/components/Spinner";

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
    preferences: {
        email: boolean;
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

    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";
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
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            console.log("Fetching users from:", `${backendUrl}/api/admin/users`);
            const res = await axios.get(`${backendUrl}/api/admin/users`, {
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

    const testEmail = async (userEmail: string) => {
        const statusKey = `email-${userEmail}`;
        setTestLoading(statusKey);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/admin/test-email`,
                { email: userEmail },
                { headers: { 'x-admin-email': ADMIN_EMAIL } }
            );
            addToast('success', 'Email Sent! ✉️', `Test email successfully sent to ${userEmail}`);
            updateTestStatus(statusKey, 'success', 'Sent!');
        } catch {
            addToast('error', 'Email Failed', `Could not send test email to ${userEmail}`);
            updateTestStatus(statusKey, 'error', 'Failed');
        } finally {
            setTestLoading(null);
        }
    };

    const testTelegram = async (chatId: string, userId: string) => {
        if (!chatId) return;
        const statusKey = `tg-${userId}`;
        setTestLoading(statusKey);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${backendUrl}/api/admin/test-telegram`,
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

    const checkEmailConfig = async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.get(`${backendUrl}/api/admin/email-config`, {
                headers: { 'x-admin-email': ADMIN_EMAIL }
            });
            console.log('Email Config:', res.data);

            const { config, transporterVerified, message } = res.data;
            const details = `Provider: ${config.provider}\nEnvironment: ${config.nodeEnv}\nGmail User: ${config.gmailUser}\nGmail Pass: ${config.gmailPass}\nTransporter: ${transporterVerified ? '✅ Verified' : '❌ Failed'}`;

            if (transporterVerified) {
                addToast('success', 'Email Config OK ✅', details);
            } else {
                addToast('error', 'Email Config Issue ⚠️', details);
            }
        } catch (err) {
            console.error('Email config check failed:', err);
            addToast('error', 'Config Check Failed', 'Could not retrieve email configuration');
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
                        <h1 className="text-3xl font-bold font-outfit">Admin Portal</h1>
                        <p className="text-slate-400">Please sign in to access the master dashboard.</p>
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
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            animate-slide-in-right p-4 rounded-2xl shadow-2xl backdrop-blur-xl border
                            flex items-start gap-3 min-w-[300px]
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

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold font-outfit flex items-center gap-3">
                            <LayoutDashboard className="text-blue-500" />
                            Master Dashboard
                        </h1>
                        <p className="text-slate-400">Monitoring {users.length} active users in the system</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl text-green-400 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Verified Admin: {user?.primaryEmailAddress?.emailAddress}
                        </div>
                        <button
                            onClick={checkEmailConfig}
                            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all"
                            title="Check email configuration"
                        >
                            <Mail className="w-4 h-4" />
                            Check Email Config
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="glass rounded-3xl overflow-hidden border-blue-500/10">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                User Directory
                            </h3>
                            <button onClick={fetchUsers} disabled={loading} className="text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                                {loading ? <Spinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
                            </button>
                        </div>

                        {error && (
                            <div className="mx-6 my-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                                <button onClick={fetchUsers} className="ml-auto underline font-bold">Retry</button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="px-8 py-4">User Details</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4">Quick Tests</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-white">{u.email}</div>
                                                <div className="text-xs text-slate-500 mt-1 font-mono">{u.clerkId}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex gap-2">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.preferences.email ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                        Email
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.telegramChatId ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                        Telegram
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex gap-3 items-center">
                                                    {/* Email Test Button with Status */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => testEmail(u.email)}
                                                            disabled={!!testLoading}
                                                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-blue-600 rounded-xl transition-all border border-slate-700 disabled:opacity-50 text-xs font-bold"
                                                        >
                                                            {testLoading === `email-${u.email}` ? <Spinner size="sm" /> : <Mail className="w-4 h-4" />}
                                                            Test Gmail
                                                        </button>
                                                        {/* Inline Email Status Indicator */}
                                                        {testStatuses[`email-${u.email}`] && (
                                                            <span className={`
                                                                animate-fade-in px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1
                                                                ${testStatuses[`email-${u.email}`].type === 'success'
                                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                }
                                                            `}>
                                                                {testStatuses[`email-${u.email}`].type === 'success'
                                                                    ? <CheckCircle className="w-3 h-3" />
                                                                    : <AlertCircle className="w-3 h-3" />
                                                                }
                                                                {testStatuses[`email-${u.email}`].message}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Telegram Test Button with Status */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => testTelegram(u.telegramChatId!, u._id)}
                                                            disabled={!u.telegramChatId || !!testLoading}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border disabled:opacity-20 text-xs font-bold ${u.telegramChatId ? 'bg-slate-800 hover:bg-sky-500 border-slate-700' : 'bg-slate-900 border-slate-800 cursor-not-allowed'}`}
                                                        >
                                                            {testLoading === `tg-${u._id}` ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                                                            Test Telegram
                                                        </button>
                                                        {/* Inline Telegram Status Indicator */}
                                                        {testStatuses[`tg-${u._id}`] && (
                                                            <span className={`
                                                                animate-fade-in px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1
                                                                ${testStatuses[`tg-${u._id}`].type === 'success'
                                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                }
                                                            `}>
                                                                {testStatuses[`tg-${u._id}`].type === 'success'
                                                                    ? <CheckCircle className="w-3 h-3" />
                                                                    : <AlertCircle className="w-3 h-3" />
                                                                }
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
                                            <td colSpan={3} className="px-8 py-20 text-center text-slate-500 italic">
                                                No users detected in the matrix.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
