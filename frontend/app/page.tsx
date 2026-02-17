"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import ContestCard from "@/components/ContestCard";
import { Filter, Trophy } from "lucide-react";
import { useUserSync } from "@/hooks/useUserSync";

interface Contest {
  _id: string;
  name: string;
  platform: string;
  startTime: string;
  duration: number;
  url: string;
}

export default function Home() {
  useUserSync();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestsRes, platformsRes] = await Promise.all([
          api.get(`/api/contests${filter !== "All" ? `?platform=${filter}` : ""}`),
          api.get(`/api/contests/platforms`)
        ]);
        setContests(contestsRes.data);
        setPlatforms(["All", ...platformsRes.data.filter((p: string) => p.toLowerCase() !== "unknown")]);
      } catch (err) {
        console.error("Error fetching contests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  return (
    <div className="space-y-12 md:space-y-24 pb-4 md:pb-20">
      {/* Hero Section */}


      {/* Contests Section */}
      <section className="space-y-5 md:space-y-8" id="contests">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-end justify-between border-b border-border/40 pb-5 md:pb-8">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Upcoming Contests</h2>

          </div>

          {/* Platform filter - horizontal scrollable on mobile */}
          <div className="flex items-center gap-2 -mx-3 px-3 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 glass p-1 md:p-1.5 rounded-xl md:rounded-2xl border-border flex-shrink-0">
              <div className="flex items-center gap-1.5 text-muted-foreground px-2 md:px-3 py-1.5 md:py-2 border-r border-border">
                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden sm:block">Platform</span>
              </div>
              <div className="flex gap-0.5 md:gap-1">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setLoading(true);
                      setFilter(p);
                    }}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all whitespace-nowrap ${filter === p
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {contests.length > 0 ? (
                contests.map((c) => <ContestCard key={c._id} contest={c} />)
              ) : (
                <div className="col-span-full py-20 md:py-32 text-center glass rounded-2xl md:rounded-3xl border-dashed border-border">
                  <Trophy className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                  <p className="text-muted-foreground text-base md:text-lg font-medium">No upcoming contests found for this platform.</p>
                  <button onClick={() => setFilter("All")} className="mt-3 md:mt-4 text-primary hover:underline text-sm">Clear all filters</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
