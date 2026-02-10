"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { Trophy, Bell, Menu, X, Lock, Home, Settings, Shield } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Navbar = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "vijesharumugam26@gmail.com";

    const isAdmin = useMemo(() => {
        return isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;
    }, [isLoaded, isSignedIn, user, ADMIN_EMAIL]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = useMemo(() => {
        const links = [
            { name: "Contests", href: "/", icon: Home },
            { name: "Settings", href: "/settings", icon: Settings },
        ];

        if (isAdmin) {
            links.push({ name: "Admin", href: "/admin", icon: Shield });
        }

        return links;
    }, [isAdmin]);

    return (
        <>
            {/* ===== TOP NAVBAR ===== */}
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-4",
                "md:pt-4",
                scrolled ? "pt-2 md:pt-2" : ""
            )}>
                <div className={cn(
                    "container mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between rounded-2xl transition-all duration-300",
                    scrolled
                        ? "glass shadow-2xl border-white/10"
                        : "bg-slate-950/80 backdrop-blur-lg md:bg-transparent md:border-transparent"
                )}>
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-slate-900 p-1.5 rounded-lg group-hover:scale-110 transition-transform border border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icon.png" alt="Logo" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                            </div>
                        </div>
                        <span className="font-outfit font-bold text-lg md:text-xl tracking-tight">
                            Contest<span className="text-blue-500">Remind</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "px-4 py-2 transition-all flex items-center gap-2 text-sm font-medium rounded-xl group",
                                    pathname === link.href
                                        ? "text-white bg-white/10"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <link.icon className={cn(
                                    "w-4 h-4 transition-colors",
                                    pathname === link.href ? "text-blue-500" : "group-hover:text-blue-500"
                                )} />
                                {link.name}
                            </Link>
                        ))}

                        <div className="h-6 w-px bg-slate-800 mx-4" />

                        {isSignedIn ? (
                            <div className="flex items-center gap-4">
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            userButtonAvatarBox: "h-9 w-9 ring-2 ring-blue-500/20 hover:ring-blue-500 transition-all"
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <SignInButton mode="modal">
                                <button className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none group">
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#a855f7_50%,#3b82f6_100%)] group-hover:opacity-100" />
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl group-hover:bg-slate-900 transition-all">
                                        Sign In
                                    </span>
                                </button>
                            </SignInButton>
                        )}
                    </div>

                    {/* Mobile: User avatar / Sign in only */}
                    <div className="md:hidden flex items-center gap-3">
                        {isSignedIn ? (
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "h-8 w-8 ring-2 ring-blue-500/20"
                                    }
                                }}
                            />
                        ) : (
                            <SignInButton mode="modal">
                                <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                                    Sign In
                                </button>
                            </SignInButton>
                        )}
                    </div>
                </div>
            </nav>

            {/* ===== MOBILE BOTTOM TAB BAR ===== */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="bg-slate-950/95 backdrop-blur-xl border-t border-white/5 px-2 pb-safe">
                    <div className="flex items-center justify-around h-16">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-[64px]",
                                        isActive
                                            ? "text-blue-500"
                                            : "text-slate-500 active:text-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-xl transition-all",
                                        isActive ? "bg-blue-500/15" : ""
                                    )}>
                                        <link.icon className={cn(
                                            "w-5 h-5 transition-all",
                                            isActive ? "text-blue-500" : ""
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-wide",
                                        isActive ? "text-blue-500" : ""
                                    )}>
                                        {link.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
