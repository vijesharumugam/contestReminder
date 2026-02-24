"use client";

import { useEffect, useMemo, useState } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    format,
    isSameDay,
    isToday,
    startOfMonth,
    subMonths,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

interface Contest {
    _id: string;
    name: string;
    platform: string;
    startTime: string;
    duration: number;
    url: string;
}

const getPlatformDot = (platform: string) => {
    const key = platform.toLowerCase();
    if (key.includes("codeforces")) return "bg-red-500";
    if (key.includes("codechef")) return "bg-amber-500";
    if (key.includes("leetcode")) return "bg-orange-500";
    if (key.includes("atcoder")) return "bg-slate-500";
    return "bg-primary";
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContests = async () => {
            try {
                const res = await api.get("/api/contests");
                setContests(res.data);
            } catch (error) {
                console.error("Error fetching contests:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContests();
    }, []);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const selectedDayContests = useMemo(
        () => contests.filter((contest) => isSameDay(new Date(contest.startTime), selectedDate)),
        [contests, selectedDate],
    );

    const upcomingContests = useMemo(
        () =>
            contests
                .filter((contest) => new Date(contest.startTime) >= new Date())
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 6),
        [contests],
    );

    const contestsInViewedMonth = useMemo(
        () =>
            contests.filter(
                (c) =>
                    new Date(c.startTime).getMonth() === currentDate.getMonth() &&
                    new Date(c.startTime).getFullYear() === currentDate.getFullYear(),
            ),
        [contests, currentDate],
    );

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
            <div className="space-y-5">
                <section className="glass rounded-2xl p-5 md:p-6">
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">Contest calendar</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Monthly view of scheduled contests with quick access to event links.
                    </p>
                </section>

                <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-4">
                        <section className="glass rounded-2xl p-4">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Selected date</h2>
                            <p className="mt-1 text-lg font-bold text-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>

                            <div className="mt-3 space-y-2">
                                {selectedDayContests.length > 0 ? (
                                    selectedDayContests.map((contest) => (
                                        <a
                                            key={contest._id}
                                            href={contest.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:border-primary/35 hover:bg-muted/55"
                                        >
                                            <p className="line-clamp-2 text-sm font-semibold text-foreground">{contest.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{format(new Date(contest.startTime), "p")} - {contest.platform}</p>
                                        </a>
                                    ))
                                ) : (
                                    <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                                        No contests scheduled on this date.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="glass rounded-2xl p-4">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Next contests</h2>
                            <div className="mt-3 space-y-2">
                                {upcomingContests.map((contest) => (
                                    <motion.div key={contest._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <a
                                            href={contest.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-xl border border-border bg-background/75 p-3 transition-colors hover:border-primary/35"
                                        >
                                            <p className="line-clamp-1 text-sm font-semibold text-foreground">{contest.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {format(new Date(contest.startTime), "MMM d, p")}
                                            </p>
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </aside>

                    <section className="glass rounded-2xl p-4 md:p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">{format(currentDate, "MMMM yyyy")}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                    className="rounded-lg border border-border bg-background/75 p-2 text-muted-foreground transition-colors hover:text-foreground"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                    className="rounded-lg border border-border bg-background/75 p-2 text-muted-foreground transition-colors hover:text-foreground"
                                    aria-label="Next month"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {contestsInViewedMonth.length === 0 &&
                            (currentDate.getMonth() > new Date().getMonth() || currentDate.getFullYear() > new Date().getFullYear()) && (
                                <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                                    No contests listed for this month yet. Platforms (Codeforces, LeetCode, CodeChef, etc.) usually publish schedules 1–2 months in advance. Check back closer to the date.
                                </p>
                            )}

                        <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <span key={day} className="py-1">{day}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, index) => (
                                <div key={`empty-${index}`} className="min-h-[96px] rounded-xl border border-transparent" />
                            ))}

                            {daysInMonth.map((day) => {
                                const dayContests = contests.filter((contest) => isSameDay(new Date(contest.startTime), day));
                                const active = isSameDay(day, selectedDate);
                                const today = isToday(day);

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "min-h-[96px] rounded-xl border p-2 text-left transition-colors",
                                            active ? "border-primary/45 bg-primary/10" : "border-border bg-background/75 hover:border-primary/30",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                                                today ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                                            )}
                                        >
                                            {format(day, "d")}
                                        </span>

                                        <div className="mt-2 space-y-1">
                                            {dayContests.slice(0, 2).map((contest) => (
                                                <span
                                                    key={contest._id}
                                                    className="flex items-center gap-1 truncate rounded-md bg-muted/55 px-1.5 py-1 text-[10px] font-medium text-foreground"
                                                >
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", getPlatformDot(contest.platform))} />
                                                    {contest.platform}
                                                </span>
                                            ))}
                                            {dayContests.length > 2 && (
                                                <span className="block text-[10px] text-muted-foreground">+{dayContests.length - 2} more</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <section className="glass rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        Add selected contests to Google Calendar
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDayContests.map((contest) => {
                            const start = new Date(contest.startTime);
                            const end = new Date(start.getTime() + contest.duration * 1000);
                            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(contest.name)}&dates=${format(start, "yyyyMMdd'T'HHmmss")}/${format(end, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(contest.url)}&location=${encodeURIComponent(contest.platform)}`;
                            return (
                                <a
                                    key={`calendar-${contest._id}`}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                                >
                                    {contest.platform}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            );
                        })}
                        {selectedDayContests.length === 0 && (
                            <p className="text-xs text-muted-foreground">Select a date with contests to generate calendar links.</p>
                        )}
                    </div>
                </section>
            </div>
        </AuthGuard>
    );
}
