"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Home, LogOut, Moon, Settings, Shield, Sun, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Sidebar = () => {
    const { isSignedIn, isAdmin, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const navLinks = useMemo(() => {
        const links = [
            { name: "Contests", href: "/", icon: Home },
            { name: "Calendar", href: "/calendar", icon: CalendarIcon },
            { name: "Settings", href: "/settings", icon: Settings },
        ];
        if (isAdmin) {
            links.push({ name: "Admin", href: "/admin", icon: Shield });
        }
        return links;
    }, [isAdmin]);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const handleSignOut = () => {
        if (window.confirm("Sign out from your account?")) {
            logout();
            router.push("/");
        }
    };

    const userLabel = user?.email || "Signed in account";
    const userInitial = user?.email?.charAt(0)?.toUpperCase() || "U";

    return (
        <>
            <aside className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-[252px] flex-col border-r border-border bg-card/86 backdrop-blur-xl">
                <div className="border-b border-border px-5 py-5">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-border bg-background/70">
                            <Image src="/icon.png" alt="ContestRemind logo" fill className="object-contain p-1.5" sizes="40px" />
                        </div>
                        <div>
                            <p className="font-outfit text-base font-bold tracking-tight text-foreground">ContestRemind</p>
                            <p className="text-[11px] text-muted-foreground">Competitive programming alerts</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                                    isActive
                                        ? "border-primary/35 bg-primary/12 text-primary"
                                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-border p-4">
                    <button
                        onClick={toggleTheme}
                        className="mb-3 flex w-full items-center justify-between rounded-xl border border-border bg-background/70 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        title="Switch theme"
                    >
                        <span>Theme</span>
                        {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {isSignedIn ? (
                        <div className="space-y-3 rounded-xl border border-border bg-background/65 p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                    {userInitial}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-foreground">{userLabel}</p>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Account</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/35 hover:bg-destructive/8 hover:text-destructive"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <UserIcon className="h-4 w-4" />
                            Sign in
                        </Link>
                    )}
                </div>
            </aside>

            <header className="md:hidden fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
                <div className="flex min-h-[calc(3.8rem+env(safe-area-inset-top))] items-center justify-between px-4 pt-safe">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-border bg-card">
                            <Image src="/icon.png" alt="ContestRemind logo" fill className="object-contain p-1" sizes="32px" />
                        </div>
                        <span className="font-outfit text-base font-bold tracking-tight text-foreground">ContestRemind</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="rounded-lg border border-border bg-card/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                            title="Switch theme"
                        >
                            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        {isSignedIn ? (
                            <button
                                onClick={handleSignOut}
                                className="rounded-lg border border-border bg-card/70 p-2 text-muted-foreground transition-colors hover:text-destructive"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        ) : (
                            <Link href="/sign-in" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-2 backdrop-blur-xl pb-safe">
                <div className="flex h-16 items-center justify-around">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex min-w-[70px] flex-col items-center justify-center rounded-xl px-3 py-2 text-[10px] font-semibold tracking-wide transition-all",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className={cn("mb-1 rounded-lg p-1.5", isActive ? "bg-primary/12" : "")}>
                                    <link.icon className="h-4 w-4" />
                                </div>
                                {link.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
