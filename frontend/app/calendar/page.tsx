"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, Clock } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Spinner } from "@/components/Spinner";

interface Contest {
    _id: string;
    name: string;
    platform: string;
    startTime: string;
    duration: number;
    url: string;
}

export default function CalendarPage() {
    const { isLoaded, isSignedIn } = useUser();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchContests = async () => {
            try {
                const res = await api.get('/api/contests');
                setContests(res.data);
            } catch (err) {
                console.error("Error fetching contests:", err);
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

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getContestsForDay = (date: Date) => {
        return contests.filter(c => isSameDay(new Date(c.startTime), date));
    };

    const upcomingContests = contests
        .filter(c => new Date(c.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5);

    const getPlatformColor = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('codeforces')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
        if (p.includes('codechef')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
        if (p.includes('leetcode')) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
        if (p.includes('atcoder')) return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20';
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Left Sidebar: Upcoming List */}
            <div className="lg:w-1/3 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-outfit mb-2 text-foreground">Upcoming Contests</h1>
                    <p className="text-muted-foreground text-sm">Don't miss scheduled events</p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Next Up</h2>
                    {upcomingContests.map((contest) => (
                        <motion.div
                            key={contest._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-2xl border bg-card/80 backdrop-blur-md transition-all hover:bg-muted/50 ${getPlatformColor(contest.platform)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full ${contest.platform.toLowerCase().includes('codeforces') ? 'bg-red-500' :
                                    contest.platform.toLowerCase().includes('codechef') ? 'bg-orange-500' :
                                        contest.platform.toLowerCase().includes('leetcode') ? 'bg-yellow-500' :
                                            'bg-blue-500'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold opacity-70 mb-1">
                                        {format(new Date(contest.startTime), "dd-MM-yyyy h:mm a")}
                                    </p>
                                    <h3 className="font-bold text-foreground truncate mb-2 text-sm md:text-base">{contest.name}</h3>

                                    <div className="flex items-center gap-3 mt-3">
                                        <a
                                            href={contest.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 font-bold hover:underline opacity-80 hover:opacity-100"
                                        >
                                            View Details <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <a
                                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(contest.name)}&dates=${format(new Date(contest.startTime), "yyyyMMdd'T'HHmmss")}/${format(new Date(new Date(contest.startTime).getTime() + contest.duration * 1000), "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(contest.url)}&location=${encodeURIComponent(contest.platform)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1.5 font-bold hover:underline opacity-80 hover:opacity-100"
                                        >
                                            Add to Calendar <CalendarIcon className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Right Side: Calendar Grid */}
            <div className="flex-1 bg-card/50 border border-border rounded-3xl p-4 md:p-6 overflow-hidden flex flex-col">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold font-outfit text-foreground">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-xl transition-colors">
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-xl transition-colors">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-sm font-semibold text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-fr flex-1">
                    {/* Empty cells for start of month */}
                    {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[120px] bg-muted/20 rounded-xl border border-transparent" />
                    ))}

                    {daysInMonth.map((day) => {
                        const dayContests = getContestsForDay(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    min-h-[80px] md:min-h-[120px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col
                                    ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:border-primary/20'}
                                    ${isTodayDate ? 'ring-1 ring-primary' : ''}
                                `}
                            >
                                <span className={`
                                    text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                                    ${isTodayDate ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                                `}>
                                    {format(day, 'd')}
                                </span>

                                <div className="space-y-1 overflow-y-auto scrollbar-hide flex-1">
                                    {dayContests.slice(0, 3).map((c, i) => (
                                        <div
                                            key={i}
                                            className={`
                                                text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate font-medium
                                                ${c.platform.toLowerCase().includes('codeforces') ? 'bg-red-500/10 text-red-700 dark:text-red-300' :
                                                    c.platform.toLowerCase().includes('codechef') ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300' :
                                                        c.platform.toLowerCase().includes('leetcode') ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300' :
                                                            'bg-blue-500/10 text-blue-700 dark:text-blue-300'}
                                            `}
                                            title={c.name}
                                        >
                                            {c.platform === 'CodeChef' ? 'CC' : c.platform === 'Codeforces' ? 'CF' : 'LC'} • {c.name}
                                        </div>
                                    ))}
                                    {dayContests.length > 3 && (
                                        <div className="text-[9px] text-muted-foreground pl-1">
                                            +{dayContests.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
