"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isToday, parseISO } from "date-fns";
import { CalendarDays, Filter, Sparkles, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";
import ContestCard from "@/components/ContestCard";

interface Contest {
    _id: string;
    name: string;
    platform: string;
    startTime: string;
    duration: number;
    url: string;
}

const toInputDate = (date: Date) => format(date, "yyyy-MM-dd");

export default function Home() {
    const [allContests, setAllContests] = useState<Contest[]>([]);
    const [todayContests, setTodayContests] = useState<Contest[]>([]);
    const [dateContests, setDateContests] = useState<Contest[]>([]);
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [platformFilter, setPlatformFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [dateLoading, setDateLoading] = useState(false);

    const fetchContests = useCallback(async (platform: string) => {
        setLoading(true);
        try {
            const platformParam = platform !== "All" ? `&platform=${encodeURIComponent(platform)}` : "";
            const [upcomingRes, todayRes, platformsRes] = await Promise.all([
                api.get(`/api/contests?${platformParam}`),
                api.get(`/api/contests?date=today${platformParam}`),
                api.get("/api/contests/platforms"),
            ]);

            setAllContests(upcomingRes.data);
            setTodayContests(todayRes.data);
            setPlatforms(["All", ...platformsRes.data.filter((p: string) => p.toLowerCase() !== "unknown")]);
        } catch (error) {
            console.error("Failed to load contests:", error);
            setAllContests([]);
            setTodayContests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContests(platformFilter);
    }, [platformFilter, fetchContests]);

    useEffect(() => {
        if (!dateFilter) {
            setDateContests([]);
            return;
        }

        const loadDateContests = async () => {
            setDateLoading(true);
            try {
                const platformParam = platformFilter !== "All" ? `&platform=${encodeURIComponent(platformFilter)}` : "";
                const res = await api.get(`/api/contests?date=${dateFilter}${platformParam}`);
                setDateContests(res.data);
            } catch (error) {
                console.error("Failed to load date contests:", error);
                setDateContests([]);
            } finally {
                setDateLoading(false);
            }
        };

        loadDateContests();
    }, [dateFilter, platformFilter]);

    const isFiltered = platformFilter !== "All" || Boolean(dateFilter);
    const selectedDateLabel = useMemo(() => {
        if (!dateFilter) return "";
        const selectedDate = parseISO(dateFilter);
        return isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d");
    }, [dateFilter]);

    const displayedContests = dateFilter ? dateContests : allContests;
    const isListLoading = dateFilter ? dateLoading : loading;

    return (
        <div className="space-y-7 md:space-y-9 pb-6">
            <section className="glass rounded-2xl p-5 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Contest Operations</p>
                        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Contest Schedule</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View today&apos;s events, filter upcoming contests, and open platform links directly.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-muted-foreground">
                            Today: <span className="font-semibold text-foreground">{todayContests.length}</span>
                        </span>
                        <span className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-muted-foreground">
                            Upcoming: <span className="font-semibold text-foreground">{allContests.length}</span>
                        </span>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-primary/25 bg-primary/12 p-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Today&apos;s contests</h2>
                        <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2].map((key) => (
                            <div key={key} className="glass h-52 animate-pulse rounded-2xl p-4">
                                <div className="mb-4 h-3 w-24 rounded-full bg-muted" />
                                <div className="mb-2 h-4 w-3/4 rounded-full bg-muted" />
                                <div className="mb-7 h-4 w-1/2 rounded-full bg-muted" />
                                <div className="h-10 rounded-xl bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : todayContests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <AnimatePresence>
                            {todayContests.map((contest, index) => (
                                <motion.div
                                    key={contest._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <ContestCard contest={contest} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="glass flex items-center gap-3 rounded-2xl border-dashed p-5">
                        <div className="rounded-xl border border-border bg-muted/50 p-2.5">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">No contests today</p>
                            <p className="text-xs text-muted-foreground">Upcoming contests are listed below.</p>
                        </div>
                    </div>
                )}
            </section>

            <section id="contests" className="space-y-4">
                <div className="glass rounded-2xl p-4 md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-foreground md:text-2xl">
                                {dateFilter ? `Contests on ${selectedDateLabel}` : "Upcoming contests"}
                            </h2>
                            {isFiltered && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Filters: {platformFilter !== "All" ? platformFilter : "All platforms"}
                                    {dateFilter ? `, ${selectedDateLabel}` : ""}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-end gap-2.5">
                            <label className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                    <Filter className="h-3.5 w-3.5" />
                                    Platform
                                </span>
                                <select
                                    value={platformFilter}
                                    onChange={(event) => setPlatformFilter(event.target.value)}
                                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary/45"
                                >
                                    {platforms.map((platform) => (
                                        <option key={platform} value={platform}>{platform}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Date
                                </span>
                                <input
                                    type="date"
                                    value={dateFilter}
                                    min={toInputDate(new Date())}
                                    onChange={(event) => setDateFilter(event.target.value)}
                                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary/45"
                                />
                            </label>

                            {isFiltered && (
                                <button
                                    onClick={() => {
                                        setPlatformFilter("All");
                                        setDateFilter("");
                                    }}
                                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isListLoading ? (
                    <div className="glass flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/16 border-t-primary" />
                        <p className="text-sm font-semibold text-foreground">Loading contests</p>
                        <p className="text-xs text-muted-foreground">Fetching the latest schedule.</p>
                    </div>
                ) : displayedContests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {displayedContests.map((contest, index) => (
                            <motion.div
                                key={contest._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <ContestCard contest={contest} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-dashed text-center">
                        <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">No contests available</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Try a different platform or date filter.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
