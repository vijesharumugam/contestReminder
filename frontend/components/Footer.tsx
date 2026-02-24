"use client";

import Link from "next/link";
import { Clock3, LifeBuoy } from "lucide-react";

const Footer = () => {
    return (
        <footer className="glass rounded-2xl border px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <p className="font-outfit text-sm font-bold text-foreground">ContestRemind</p>
                    <p className="text-xs text-muted-foreground">
                        Reliable contest schedules and reminders for competitive programmers.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                    <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">Contests</Link>
                    <Link href="/calendar" className="text-muted-foreground transition-colors hover:text-foreground">Calendar</Link>
                    <Link href="/settings" className="text-muted-foreground transition-colors hover:text-foreground">Settings</Link>
                    <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">Privacy</Link>
                    <Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">Terms</Link>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between">
                <p>(c) {new Date().getFullYear()} ContestRemind. All rights reserved.</p>
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        System status monitored
                    </span>
                    <a href="mailto:support@contestremind.com" className="inline-flex items-center gap-1.5 hover:text-foreground">
                        <LifeBuoy className="h-3.5 w-3.5" />
                        support@contestremind.com
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
