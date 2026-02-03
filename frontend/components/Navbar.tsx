"use client";

import Link from "next/link";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { Trophy, Bell, Menu, X, Lock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Navbar = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const ADMIN_EMAIL = "vijesharumugam26@gmail.com";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = useMemo(() => {
        const links = [
            { name: "Contests", href: "/", icon: Trophy },
            { name: "Settings", href: "/settings", icon: Bell },
        ];

        if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
            links.push({ name: "Admin", href: "/admin", icon: Lock });
        }

        return links;
    }, [isLoaded, isSignedIn, user]);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-4",
            scrolled ? "pt-2" : "pt-4"
        )}>
            <div className={cn(
                "container mx-auto px-6 h-16 flex items-center justify-between rounded-2xl transition-all duration-300",
                scrolled
                    ? "glass shadow-2xl border-white/10"
                    : "bg-transparent border-transparent"
            )}>
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-slate-900 p-1.5 rounded-lg group-hover:scale-110 transition-transform border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icon.png" alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                    </div>
                    <span className="font-outfit font-bold text-xl tracking-tight hidden sm:block">
                        Contest<span className="text-blue-500">Remind</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm font-medium hover:bg-white/5 rounded-xl group"
                        >
                            <link.icon className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
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

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Nav */}
            <div className={cn(
                "md:hidden fixed inset-x-4 top-24 glass rounded-3xl p-4 flex flex-col gap-2 transition-all duration-300 transform",
                isOpen
                    ? "translate-y-0 opacity-100 scale-100"
                    : "-translate-y-10 opacity-0 scale-95 pointer-events-none"
            )}>
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 text-slate-400 p-4 rounded-2xl hover:bg-white/5 transition-all text-base font-semibold"
                    >
                        <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-blue-600 transition-colors">
                            <link.icon className="w-5 h-5" />
                        </div>
                        {link.name}
                    </Link>
                ))}
                {!isSignedIn && (
                    <SignInButton mode="modal">
                        <button className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl text-center font-bold shadow-lg shadow-blue-500/20 transition-all">
                            Get Started
                        </button>
                    </SignInButton>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

