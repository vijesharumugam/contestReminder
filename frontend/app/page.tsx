"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, isToday, parseISO, startOfDay } from "date-fns";
import api from "@/lib/api";
import ContestCard from "@/components/ContestCard";
import { Filter, Trophy, CalendarDays, X, Sparkles, CalendarCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Contest {
  _id: string;
  name: string;
  platform: string;
  startTime: string;
  duration: number;
  url: string;
}

// Format a Date to YYYY-MM-DD for the <input type="date"> value
function toInputDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// Get the local date string used as the canonical "today" key
function todayStr() {
  return toInputDate(new Date());
}

export default function Home() {
  const [allContests, setAllContests] = useState<Contest[]>([]);
  const [todayContests, setTodayContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // "" = no date filter
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  // ─── Fetch upcoming + today contests together on mount / platform change ───
  const fetchContests = useCallback(async (platform: string) => {
    setLoading(true);
    try {
      const platformParam = platform !== "All" ? `&platform=${platform}` : "";

      const [upcomingRes, todayRes, platformsRes] = await Promise.all([
        api.get(`/api/contests?${platformParam}`),
        api.get(`/api/contests?date=today${platformParam}`),
        api.get(`/api/contests/platforms`),
      ]);

      setAllContests(upcomingRes.data);
      setTodayContests(todayRes.data);
      setPlatforms(["All", ...platformsRes.data.filter((p: string) => p.toLowerCase() !== "unknown")]);
    } catch (err) {
      console.error("Error fetching contests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests(platformFilter);
  }, [platformFilter, fetchContests]);

  // ─── Date-filtered upcoming contests ─────────────────────────────────────
  const [dateContests, setDateContests] = useState<Contest[]>([]);
  const [dateLoading, setDateLoading] = useState(false);

  useEffect(() => {
    if (!dateFilter) {
      setDateContests([]);
      return;
    }
    const load = async () => {
      setDateLoading(true);
      try {
        const platformParam = platformFilter !== "All" ? `&platform=${platformFilter}` : "";
        const res = await api.get(`/api/contests?date=${dateFilter}${platformParam}`);
        setDateContests(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setDateLoading(false);
      }
    };
    load();
  }, [dateFilter, platformFilter]);

  // The main list — if a date filter is active, show date results; otherwise upcoming
  const displayedContests = dateFilter ? dateContests : allContests;
  const isDateLoading = dateFilter ? dateLoading : loading;

  // Format selected date for display
  const selectedDateLabel = useMemo(() => {
    if (!dateFilter) return null;
    const d = parseISO(dateFilter);
    if (isToday(d)) return "Today";
    return format(d, "EEE, MMM d");
  }, [dateFilter]);

  const clearDateFilter = () => {
    setDateFilter("");
    setShowDatePicker(false);
  };

  const clearAllFilters = () => {
    setPlatformFilter("All");
    setDateFilter("");
    setShowDatePicker(false);
  };

  const hasActiveFilters = platformFilter !== "All" || dateFilter !== "";

  return (
    <div className="space-y-8 md:space-y-12 pb-4 md:pb-20">

      {/* ── TODAY'S CONTESTS SECTION ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <CalendarCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">
              Today&apos;s Contests
            </h2>
            <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM do · yyyy")}</p>
          </div>
          {!loading && todayContests.length > 0 && (
            <span className="ml-auto px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              {todayContests.length} contest{todayContests.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          // Skeleton loader for today section
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-xl md:rounded-2xl p-4 md:p-5 h-52 animate-pulse border border-border/40">
                <div className="h-3 bg-muted rounded-full w-24 mb-4" />
                <div className="h-4 bg-muted rounded-full w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded-full w-1/2 mb-6" />
                <div className="h-8 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : todayContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence>
              {todayContests.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <ContestCard contest={c} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 glass rounded-xl border border-dashed border-border px-5 py-6"
          >
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">No contests today</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enjoy the break! Check upcoming contests below.
              </p>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
      <div className="w-full h-px bg-border/60" />

      {/* ── UPCOMING CONTESTS SECTION ────────────────────────────────────── */}
      <section className="space-y-5 md:space-y-8" id="contests">
        {/* Header row */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-end justify-between border-b border-border/40 pb-5 md:pb-8">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {dateFilter
                ? selectedDateLabel === "Today"
                  ? "Today's Contests"
                  : `Contests on ${selectedDateLabel}`
                : "Upcoming Contests"}
            </h2>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                Filtered by:{" "}
                {platformFilter !== "All" && (
                  <span className="text-primary font-semibold">{platformFilter}</span>
                )}
                {platformFilter !== "All" && dateFilter && <span className="mx-1">·</span>}
                {dateFilter && (
                  <span className="text-primary font-semibold">{selectedDateLabel}</span>
                )}
              </p>
            )}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Platform filter dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowPlatformDropdown((v) => !v)}
                className={`flex items-center gap-1.5 glass border border-border px-3 py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all ${platformFilter !== "All"
                  ? "text-primary border-primary/30 bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                <span>{platformFilter === "All" ? "Platform" : platformFilter}</span>
                <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-200 ${showPlatformDropdown ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showPlatformDropdown && (
                  <>
                    <div className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[2px]" onClick={() => setShowPlatformDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="fixed inset-x-4 top-[20%] md:absolute md:inset-auto md:left-0 md:top-full mt-2 z-50 glass border border-border rounded-2xl shadow-2xl p-2 min-w-[200px] md:w-64"
                    >
                      {platforms.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setLoading(true);
                            setPlatformFilter(p);
                            setShowPlatformDropdown(false);
                          }}
                          className={`flex items-center w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${platformFilter === p
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Date filter button */}
            <div className="relative flex-shrink-0">
              {dateFilter ? (
                // Active date chip
                <div className="flex items-center gap-1 glass border border-primary/30 bg-primary/10 rounded-xl px-3 py-2">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] md:text-xs font-bold text-primary">{selectedDateLabel}</span>
                  <button
                    onClick={clearDateFilter}
                    className="ml-1 text-primary/60 hover:text-primary transition-colors"
                    title="Clear date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDatePicker((v) => !v)}
                  className={`flex items-center gap-1.5 glass border border-border px-3 py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all ${showDatePicker
                    ? "text-primary border-primary/30 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  <span className="hidden sm:inline">Filter by Date</span>
                  <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-200 ${showDatePicker ? "rotate-180" : ""}`} />
                </button>
              )}

              {/* Date picker dropdown */}
              <AnimatePresence>
                {showDatePicker && !dateFilter && (
                  <>
                    <div className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[2px]" onClick={() => setShowDatePicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="fixed inset-x-4 top-[20%] md:absolute md:inset-auto md:right-0 md:top-full mt-2 z-50 glass border border-border rounded-2xl shadow-2xl p-4 md:p-5 md:w-80"
                    >
                      <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 md:mb-4">
                        Select Date
                      </p>

                      {/* Quick picks */}
                      <div className="flex flex-col gap-2 mb-4">
                        {[
                          { label: "Today", value: todayStr() },
                          { label: "Tomorrow", value: toInputDate(new Date(Date.now() + 86_400_000)) },
                          { label: "In 2 Days", value: toInputDate(new Date(Date.now() + 2 * 86_400_000)) },
                          { label: "In 3 Days", value: toInputDate(new Date(Date.now() + 3 * 86_400_000)) },
                        ].map(({ label, value }) => (
                          <button
                            key={value}
                            onClick={() => {
                              setDateFilter(value);
                              setShowDatePicker(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-left text-foreground hover:bg-primary/10 hover:text-primary transition-all group"
                          >
                            <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
                              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <span>{label}</span>
                            <span className="ml-auto text-muted-foreground text-[10px] font-medium">{format(parseISO(value), "MMM d")}</span>
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="w-full h-px bg-border/60 mb-4" />

                      {/* Custom date input */}
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                          Custom Date
                        </span>
                        <div className="relative">
                          <input
                            type="date"
                            min={todayStr()}
                            onChange={(e) => {
                              if (e.target.value) {
                                setDateFilter(e.target.value);
                                setShowDatePicker(false);
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 cursor-pointer transition-all"
                          />
                        </div>
                      </label>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Clear all filters button */}
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] md:text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-all"
              >
                <X className="w-3 h-3" />
                Clear
              </motion.button>
            )}
          </div>
        </div>

        {/* Contest grid */}
        {isDateLoading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 gap-4 md:gap-6">
            <div className="relative">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 md:w-16 md:h-16 border-4 border-primary/5 rounded-full blur-sm" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-foreground font-bold text-base md:text-lg">Fetching Contests</p>
              <p className="text-muted-foreground text-xs md:text-sm">Validating latest schedules...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${platformFilter}_${dateFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {displayedContests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                  {displayedContests.map((c, i) => (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ContestCard contest={c} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 md:py-32 text-center glass rounded-2xl md:rounded-3xl border-dashed border-border">
                  <Trophy className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                  <p className="text-muted-foreground text-base md:text-lg font-medium">
                    {dateFilter
                      ? `No contests found for ${selectedDateLabel}${platformFilter !== "All" ? ` on ${platformFilter}` : ""}.`
                      : platformFilter !== "All"
                        ? `No upcoming contests for ${platformFilter}.`
                        : "No upcoming contests found."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 md:mt-4 text-primary hover:underline text-sm"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Close date picker when clicking outside */}
      {showDatePicker && !dateFilter && (
        <div className="fixed inset-0 z-20" onClick={() => setShowDatePicker(false)} />
      )}
    </div>
  );
}
