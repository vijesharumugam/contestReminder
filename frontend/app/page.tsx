"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ContestCard from "@/components/ContestCard";
import { Filter, Zap, Bell, Globe, ArrowRight, Trophy } from "lucide-react";
import { useUserSync } from "@/hooks/useUserSync";
import { motion } from "framer-motion";

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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const [contestsRes, platformsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/contests${filter !== "All" ? `?platform=${filter}` : ""}`),
          axios.get(`${backendUrl}/api/contests/platforms`)
        ]);
        setContests(contestsRes.data);
        setPlatforms(["All", ...platformsRes.data]);
      } catch (err) {
        console.error("Error fetching contests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 text-center space-y-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4"
        >
          <Zap className="w-3 h-3 fill-blue-500" />
          <span>The #1 Coding Contest Tracker</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
        >
          Master the Leaderboard with <span className="bg-gradient-to-r from-blue-400 via-blue-600 to-purple-600 bg-clip-text text-transparent">Smart Reminders</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          Sync your calendar with upcoming coding matches from global platforms.
          Get instant alerts and never miss a competitive edge.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <a
            href="#contests"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            Explore Contests <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="/settings"
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold border border-white/5 transition-all active:scale-95"
          >
            Set Up Reminders
          </a>
        </motion.div>

        {/* Floating background decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full max-w-4xl">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Bell, title: "30-Min Alerts", desc: "Receive timely pings before any contest starts so you're always ready." },
          { icon: Globe, title: "Global Coverage", desc: "Support for Codeforces, LeetCode, CodeChef, and many more upcoming." },
          { icon: Trophy, title: "Track Progress", desc: "Easily access contest links and submission pages in one unified dashboard." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="glass p-8 rounded-3xl border-white/5 space-y-4"
          >
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <feat.icon className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">{feat.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Contests Section */}
      <section className="space-y-8" id="contests">
        <div className="flex flex-col md:flex-row gap-6 items-end justify-between border-b border-white/5 pb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-white">Upcoming Contests</h2>
            <p className="text-slate-500 font-medium">Synchronized with platform APIs every 6 hours</p>
          </div>

          <div className="flex items-center gap-2 glass p-1.5 rounded-2xl border-white/10">
            <div className="flex items-center gap-2 text-slate-500 px-3 py-2 border-r border-white/5">
              <Filter className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest hidden lg:block">Platform</span>
            </div>
            <div className="flex gap-1">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setLoading(true);
                    setFilter(p);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === p
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/5 rounded-full blur-sm" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-white font-bold text-lg">Fetching Contests</p>
              <p className="text-slate-500 text-sm">Validating latest schedules...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contests.length > 0 ? (
                contests.map((c) => <ContestCard key={c._id} contest={c} />)
              ) : (
                <div className="col-span-full py-32 text-center glass rounded-3xl border-dashed border-white/10">
                  <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg font-medium">No upcoming contests found for this platform.</p>
                  <button onClick={() => setFilter("All")} className="mt-4 text-blue-500 hover:underline">Clear all filters</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

