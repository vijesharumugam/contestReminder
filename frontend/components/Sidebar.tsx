"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser, SignInButton, useClerk } from "@clerk/nextjs";
import {
    Home,
    Calendar as CalendarIcon,
    Settings,
    Shield,
    LogIn,
    LogOut,
    Trophy,
    HelpCircle,
    Sun,
    Moon,
    User as UserIcon
} from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const Sidebar = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useClerk();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Use timeout to avoid synchronous state update warning during hydration mismatch check
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";

    const isAdmin = useMemo(() => {
        return isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;
    }, [isLoaded, isSignedIn, user, ADMIN_EMAIL]);

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

    const themeIcon = !mounted ? <div className="w-6 h-6" /> : (theme === "dark" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />);
    const mobileThemeIcon = !mounted ? <div className="w-5 h-5" /> : (theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />);

    return (
        <>
            {/* Desktop Sidebar - Narrow Vertical Style */}
            <aside className="hidden md:flex flex-col w-[68px] h-screen fixed left-0 top-0 border-r border-border bg-card z-50 py-6 items-center">
                {/* Logo */}
                <div className="mb-8">
                    <Link href="/" className="group relative flex items-center justify-center">
                        <div className="absolute -inset-3 bg-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative w-10 h-10">
                            <Image src="/icon.png" alt="Logo" fill className="object-contain drop-shadow-lg" sizes="40px" />
                        </div>
                    </Link>
                </div>

                {/* Divider */}
                <div className="w-8 h-px bg-border mb-6"></div>

                {/* Navigation Links */}
                <div className="flex-1 w-full px-4 space-y-4 flex flex-col items-center">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-lg border border-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                                title={link.name}
                            >
                                <link.icon
                                    className={cn(
                                        "w-6 h-6 transition-transform duration-300",
                                        isActive ? "scale-110" : "group-hover:scale-110"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {isActive && (
                                    <div className="absolute -right-[17px] top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full shadow-lg"></div>
                                )}
                            </Link>
                        );
                    })}

                    <div className="w-8 h-px bg-border my-2"></div>

                    {/* Theme Switcher Button (Desktop) */}
                    <button
                        onClick={toggleTheme}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        title="Toggle Theme"
                    >
                        {themeIcon}
                    </button>

                    <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Leaderboard">
                        <Trophy className="w-6 h-6" />
                    </button>

                    <div className="flex-1"></div>

                    <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all mb-2" title="Help & Support">
                        <HelpCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Footer / User Profile */}
                <div className="w-full px-4 pt-4 border-t border-border flex flex-col items-center gap-4">
                    {isSignedIn ? (
                        <div className="flex flex-col items-center gap-4">
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "h-10 w-10 ring-2 ring-border hover:ring-primary/50 transition-all",
                                        userButtonTrigger: "focus:shadow-none"
                                    }
                                }}
                            />
                            <button
                                onClick={() => signOut()}
                                className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-xl hover:bg-destructive/10"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <SignInButton mode="modal">
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg shadow-primary/20 group" title="Sign In">
                                <UserIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </SignInButton>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Navigation (Unchanged) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border px-2 pb-safe">
                <div className="flex items-center justify-around h-16">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-[64px]",
                                    isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-xl transition-all", isActive ? "bg-primary/10" : "")}>
                                    <link.icon className={cn("w-5 h-5 transition-all", isActive ? "text-primary" : "")} />
                                </div>
                                <span className={cn("text-[10px] font-bold tracking-wide", isActive ? "text-primary" : "")}>
                                    {link.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border flex items-center justify-between px-4 pt-safe min-h-[calc(4rem+env(safe-area-inset-top))]">
                <div className="flex items-center gap-3">
                    {/* Theme Switcher Button (Mobile Left) */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-border/50"
                        title="Toggle Theme"
                    >
                        {mobileThemeIcon}
                    </button>

                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                            <Image src="/icon.png" alt="Logo" fill className="object-contain" sizes="32px" />
                        </div>
                        <span className="font-outfit font-bold text-lg tracking-tight text-foreground">
                            Contest<span className="text-primary">Remind</span>
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {isSignedIn ? (
                        <UserButton afterSignOutUrl="/" />
                    ) : (
                        <SignInButton mode="modal">
                            <button className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg">Sign In</button>
                        </SignInButton>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
