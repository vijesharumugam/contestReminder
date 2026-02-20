"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import {
    Users, Send, Lock, LayoutDashboard, CheckCircle, AlertCircle,
    ShieldAlert, X, Bell, Smartphone, RefreshCw, Server,
    Calendar, Activity, Radio, Search, Filter
} from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface Toast {
    id: string;
    type: 'success' | 'error';
    title: string;
    message: string;
}

interface UserItem {
    _id: string;
    email: string;
    role: string;
    telegramChatId?: string;
    fcmTokens?: string[];
    createdAt: string;
    preferences: {
        push?: boolean;
        telegram: boolean;
    };
}

interface DashboardStats {
    users: { total: number; fcm: number; telegram: number };
    contests: { total: number; upcoming: number };
    lastRun: string | null;
    serverTime: string;
}

interface SystemLog {
    _id: string;
    type: string;
    userId: { email: string } | null;
    contestId: { name: string; platform: string } | null;
    sentAt: string;
}

export default function AdminPage() {
    const { user, isLoaded, isSignedIn, isAdmin } = useAuth();

    // Data States
    const [users, setUsers] = useState<UserItem[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [logs, setLogs] = useState<SystemLog[]>([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'broadcast'>('overview');
    const [searchQuery, setSearchQuery] = useState("");
    const [testLoading, setTestLoading] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Form States
    const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", target: "all" });
    const [broadcastLoading, setBroadcastLoading] = useState(false);

    // --- Helpers ---
    const addToast = (type: 'success' | 'error', title: string, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- API Calls ---
    const fetchAllData = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            // Parallel fetch for speed (JWT token is sent automatically via axios interceptor)
            const [usersRes, statsRes, logsRes] = await Promise.allSettled([
                api.get('/api/admin/users'),
                api.get('/api/admin/stats'),
                api.get('/api/admin/logs')
            ]);

            if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data);

        } catch (err) {
            console.error("Dashboard fetch failed:", err);
            addToast('error', 'Fetch Error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    // Initial Load
    useEffect(() => {
        if (isLoaded && isAdmin) {
            fetchAllData();
            // Auto-refresh every 60s
            const interval = setInterval(fetchAllData, 60000);
            return () => clearInterval(interval);
        }
    }, [isLoaded, isAdmin, fetchAllData]);

    // --- Actions ---
    const clearFCM = async (userId: string) => {
        if (!confirm('Clear all native push tokens for this user?')) return;
        setLoading(true);
        try {
            await api.post(`/api/admin/clear-fcm`, { userId });
            addToast('success', 'Tokens Cleared', 'FCM tokens reset.');
            fetchAllData();
        } catch (err) {
            addToast('error', 'Failed', 'Could not clear tokens.');
        } finally {
            setLoading(false);
        }
    };

    const sendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm(`Send "${broadcastForm.title}" to ${broadcastForm.target.toUpperCase()} users?`)) return;

        setBroadcastLoading(true);
        try {
            await api.post('/api/admin/broadcast', broadcastForm);
            addToast('success', 'Broadcast Sent', 'Message queued for delivery.');
            setBroadcastForm({ title: "", message: "", target: "all" });
        } catch (err) {
            addToast('error', 'Broadcast Failed', 'Could not send message.');
        } finally {
            setBroadcastLoading(false);
        }
    };

    const testNotification = async (type: 'fcm' | 'telegram', id: string, userId: string) => {
        const key = `${type}-${userId}`;
        setTestLoading(key);
        try {
            const endpoint = type === 'fcm' ? '/api/admin/test-fcm' : '/api/admin/test-telegram';
            const payload = type === 'fcm' ? { userId } : { chatId: id };

            const res = await api.post(endpoint, payload);
            const data = res.data;

            if (type === 'fcm' && data.failure > 0) {
                if (data.success === 0) {
                    addToast('error', 'Sending Failed', `All tokens failed. ${data.removed} invalid tokens removed.`);
                } else {
                    addToast('success', 'Partial Success', `Sent: ${data.success}, Failed: ${data.failure}`);
                }
            } else {
                addToast('success', 'Test Sent', `${type.toUpperCase()} test sent successfully.`);
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || 'Unknown error';
            addToast('error', 'Test Failed', `${msg}`);
        } finally {
            setTestLoading(null);
        }
    };

    // --- Filtered Users ---
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const lower = searchQuery.toLowerCase();
        return users.filter(u =>
            u.email.toLowerCase().includes(lower) ||
            u._id.toLowerCase().includes(lower) ||
            u.telegramChatId?.toLowerCase().includes(lower)
        );
    }, [users, searchQuery]);

    // --- Auth Check ---
    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

    if (!isSignedIn || !isAdmin) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="glass p-8 rounded-3xl w-full max-w-md text-center space-y-6 border-red-500/20 shadow-2xl shadow-red-500/5">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                    <h1 className="text-3xl font-bold font-outfit text-red-500">Restricted Area</h1>
                    <p className="text-muted-foreground">Administrative privileges required.</p>
                    <Link href="/" className="block btn-primary py-3 rounded-xl">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 p-4 md:p-6 space-y-8">
            {/* Toast Container */}
            <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                                "pointer-events-auto p-4 rounded-xl shadow-lg border backdrop-blur-xl w-80 flex items-start gap-3",
                                t.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                            {t.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <div>
                                <h4 className="font-bold text-sm">{t.title}</h4>
                                <p className="text-xs opacity-90">{t.message}</p>
                            </div>
                            <button onClick={() => removeToast(t.id)} className="ml-auto hover:bg-white/10 p-1 rounded"><X className="w-4 h-4" /></button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-outfit text-foreground flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-violet-500" />
                        Admin Console
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Server className={cn("w-3 h-3", !stats && !loading ? "text-red-500" : "text-muted-foreground")} />
                        <span className={cn("text-xs", !stats && !loading ? "text-red-400 font-bold" : "text-muted-foreground")}>
                            {loading ? 'Connecting...' : stats ? `Server Time: ${new Date(stats.serverTime).toLocaleTimeString()}` : 'Server Offline'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAllData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    <div className={cn(
                        "px-4 py-2 rounded-full text-sm font-mono border flex items-center gap-2 transition-colors",
                        stats ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", stats ? "bg-emerald-500" : "bg-red-500")} />
                        {stats ? "System Online" : "System Offline"}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Users"
                    value={stats?.users.total ?? '-'}
                    icon={Users}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <StatCard
                    label="Active App Users"
                    value={stats?.users.fcm ?? '-'}
                    icon={Smartphone}
                    color="text-fuchsia-400"
                    bg="bg-fuchsia-500/10"
                    border="border-fuchsia-500/20"
                />
                <StatCard
                    label="Telegram Connected"
                    value={stats?.users.telegram ?? '-'}
                    icon={Send}
                    color="text-sky-400"
                    bg="bg-sky-500/10"
                    border="border-sky-500/20"
                />
                <StatCard
                    label="Upcoming Contests"
                    value={stats?.contests.upcoming ?? '-'}
                    subValue={stats ? `Total: ${stats.contests.total}` : undefined}
                    icon={Calendar}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity}>Overview</TabButton>
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users}>User Management</TabButton>
                <TabButton active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} icon={Radio}>Broadcast</TabButton>
                <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Server}>System Logs</TabButton>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-violet-400" /> Recent System Activity
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-bold">Last Scheduler Run</p>
                                            <p className="text-xs text-muted-foreground">{stats?.lastRun ? new Date(stats.lastRun).toLocaleString() : 'No recent logs'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded">SYSTEM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Search Bar */}
                        <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-2xl border border-white/5 mx-1">
                            <Search className="w-5 h-5 text-muted-foreground ml-2" />
                            <input
                                type="text"
                                placeholder="Search users by email, or ID..."
                                className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted-foreground/50 h-10 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="pr-4 text-xs text-muted-foreground font-mono hidden md:block">{filteredUsers.length} Results</div>
                        </div>

                        {/* Mobile View: Card List */}
                        <div className="md:hidden space-y-3">
                            {filteredUsers.map(u => (
                                <div key={u._id} className="glass p-4 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="max-w-[70%]">
                                            <p className="font-semibold text-foreground text-sm truncate">{u.email}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono truncate">{u._id}</p>
                                        </div>
                                        {/* Date */}
                                        <div className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Platforms */}
                                    <div className="flex gap-2 flex-wrap">
                                        {(u.fcmTokens?.length || 0) > 0 && (
                                            <span className="px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg text-[10px] uppercase font-bold border border-fuchsia-500/20 flex items-center gap-1">
                                                <Smartphone className="w-3 h-3" /> Native
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); clearFCM(u._id); }}
                                                    title="Clear Tokens"
                                                    className="hover:bg-fuchsia-500/20 p-0.5 rounded ml-1"
                                                ><X className="w-3 h-3" /></button>
                                            </span>
                                        )}
                                        {u.telegramChatId && (
                                            <span className="px-2 py-1 bg-sky-500/10 text-sky-400 rounded-lg text-[10px] uppercase font-bold border border-sky-500/20 flex items-center gap-1">
                                                <Send className="w-3 h-3" /> Telegram
                                            </span>
                                        )}
                                        {(!u.fcmTokens?.length && !u.telegramChatId) && (
                                            <span className="text-[10px] text-muted-foreground italic">No platforms connected</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => testNotification('fcm', '', u._id)}
                                            disabled={!u.fcmTokens?.length || testLoading === `fcm-${u._id}`}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 disabled:opacity-30 transition-colors text-xs font-bold"
                                        >
                                            {testLoading === `fcm-${u._id}` ? <Spinner size="sm" /> : <Bell className="w-3 h-3" />}
                                            Test Push
                                        </button>
                                        <button
                                            onClick={() => testNotification('telegram', u.telegramChatId!, u._id)}
                                            disabled={!u.telegramChatId || testLoading === `telegram-${u._id}`}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 disabled:opacity-30 transition-colors text-xs font-bold"
                                        >
                                            {testLoading === `telegram-${u._id}` ? <Spinner size="sm" /> : <Send className="w-3 h-3" />}
                                            Test Telegram
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && <div className="text-center text-muted-foreground text-sm py-4">No users found matching &quot;{searchQuery}&quot;</div>}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block glass overflow-hidden rounded-3xl border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Connected Platforms</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredUsers.map(u => (
                                        <tr key={u._id} className="hover:bg-white/[0.02]">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground">{u.email}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{u._id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {(u.fcmTokens?.length || 0) > 0 && (
                                                        <span className="px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg text-[10px] uppercase font-bold border border-fuchsia-500/20 flex items-center gap-1">
                                                            <Smartphone className="w-3 h-3" /> Native
                                                            <button
                                                                onClick={() => clearFCM(u._id)}
                                                                title="Clear Tokens"
                                                                className="hover:bg-fuchsia-500/20 p-0.5 rounded ml-1"
                                                            ><X className="w-3 h-3" /></button>
                                                        </span>
                                                    )}
                                                    {u.telegramChatId && (
                                                        <span className="px-2 py-1 bg-sky-500/10 text-sky-400 rounded-lg text-[10px] uppercase font-bold border border-sky-500/20 flex items-center gap-1">
                                                            <Send className="w-3 h-3" /> Telegram
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => testNotification('fcm', '', u._id)}
                                                        disabled={!u.fcmTokens?.length || testLoading === `fcm-${u._id}`}
                                                        className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors text-fuchsia-400"
                                                        title="Test Native Push"
                                                    >
                                                        {testLoading === `fcm-${u._id}` ? <Spinner size="sm" /> : <Bell className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => testNotification('telegram', u.telegramChatId!, u._id)}
                                                        disabled={!u.telegramChatId || testLoading === `telegram-${u._id}`}
                                                        className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors text-sky-400"
                                                        title="Test Telegram"
                                                    >
                                                        {testLoading === `telegram-${u._id}` ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && <div className="p-8 text-center text-muted-foreground italic">No users found.</div>}
                        </div>
                    </div>
                )}

                {/* BROADCAST TAB */}
                {activeTab === 'broadcast' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <div className="glass p-8 rounded-3xl border-violet-500/20">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Radio className="w-6 h-6 text-violet-400" /> Global Broadcast
                            </h3>
                            <form onSubmit={sendBroadcast} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Audience</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'all', label: 'All Users', icon: Users },
                                            { id: 'fcm', label: 'App Only', icon: Smartphone },
                                            { id: 'telegram', label: 'Telegram Only', icon: Send }
                                        ].map(opt => (
                                            <div
                                                key={opt.id}
                                                onClick={() => setBroadcastForm(p => ({ ...p, target: opt.id }))}
                                                className={cn(
                                                    "cursor-pointer p-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                                    broadcastForm.target === opt.id
                                                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10 text-muted-foreground"
                                                )}
                                            >
                                                <opt.icon className="w-5 h-5" />
                                                <span className="text-xs font-bold">{opt.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Notification Title</label>
                                    <input
                                        required
                                        value={broadcastForm.title}
                                        onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-violet-500/50 transition-colors font-bold"
                                        placeholder="e.g. System Maintenance"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Message Body</label>
                                    <textarea
                                        required
                                        value={broadcastForm.message}
                                        onChange={e => setBroadcastForm(p => ({ ...p, message: e.target.value }))}
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-violet-500/50 transition-colors resize-none"
                                        placeholder="Enter your message here..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={broadcastLoading}
                                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {broadcastLoading ? <Spinner size="sm" className="text-white" /> : <Send className="w-5 h-5" />}
                                    Send Broadcast
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* LOGS TAB */}
                {activeTab === 'logs' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="glass overflow-hidden rounded-3xl border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Context</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {logs.map(log => (
                                        <tr key={log._id} className="hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                                {new Date(log.sentAt || '').toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-white/10 rounded text-xs font-bold uppercase tracking-wider">
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {log.userId?.email && <div className="text-foreground">{log.userId.email}</div>}
                                                {log.contestId?.name && <div className="text-muted-foreground">{log.contestId.name}</div>}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-muted-foreground italic">No logs found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Subcomponents ---

function StatCard({ label, value, subValue, icon: Icon, color, bg, border }: any) {
    return (
        <div className={cn("glass p-5 rounded-2xl flex items-center justify-between border", border)}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <div className="text-3xl font-bold font-outfit text-foreground">{value}</div>
                {subValue && <p className="text-[10px] text-muted-foreground mt-1">{subValue}</p>}
            </div>
            <div className={cn("p-3 rounded-xl", bg, color)}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, children }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                active
                    ? "bg-foreground text-background shadow-lg scale-105"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className="w-4 h-4" />
            {children}
        </button>
    );
}
