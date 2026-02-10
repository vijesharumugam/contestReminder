"use client";

import { ExternalLink, Clock, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Contest {
    _id: string;
    name: string;
    platform: string;
    startTime: string;
    duration: number;
    url: string;
}

const ContestCard = ({ contest }: { contest: Contest }) => {
    const startDate = new Date(contest.startTime);
    const durationHours = Math.floor(contest.duration / 3600);
    const durationMins = Math.floor((contest.duration % 3600) / 60);

    const getPlatformStyles = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('codeforces')) return {
            bg: 'from-red-500/10 to-red-600/10',
            text: 'text-red-400',
            border: 'border-red-500/20',
            glow: 'group-hover:shadow-red-500/20'
        };
        if (p.includes('codechef')) return {
            bg: 'from-orange-500/10 to-orange-600/10',
            text: 'text-orange-400',
            border: 'border-orange-500/20',
            glow: 'group-hover:shadow-orange-500/20'
        };
        if (p.includes('leetcode')) return {
            bg: 'from-yellow-500/10 to-yellow-600/10',
            text: 'text-yellow-400',
            border: 'border-yellow-500/20',
            glow: 'group-hover:shadow-yellow-500/20'
        };
        return {
            bg: 'from-blue-500/10 to-blue-600/10',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            glow: 'group-hover:shadow-blue-500/20'
        };
    };

    const styles = getPlatformStyles(contest.platform);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className={`group relative glass rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all duration-500 border ${styles.border} ${styles.glow} hover:shadow-2xl`}
        >
            {/* Background Glow */}
            <div className={`absolute -inset-1 bg-gradient-to-br ${styles.bg} rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10`} />

            <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase border ${styles.border} ${styles.text} bg-slate-900/50 backdrop-blur-md`}>
                    {contest.platform}
                </div>
                <a
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </a>
            </div>

            <h3 className="text-base md:text-xl font-bold font-outfit text-white mb-4 md:mb-6 group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem]">
                {contest.name}
            </h3>

            {/* Mobile: horizontal layout, Desktop: stacked */}
            <div className="flex gap-2 md:flex-col md:gap-4 mb-4 md:mb-8">
                <div className="flex-1 flex items-center gap-3 text-slate-400 bg-white/5 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
                    <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500">Starts At</p>
                        <p className="text-[11px] md:text-sm font-semibold truncate">{format(startDate, "EEE, MMM do · p")}</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-3 text-slate-400 bg-white/5 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
                    <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg">
                        <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration</p>
                        <p className="text-[11px] md:text-sm font-semibold uppercase">{durationHours}h {durationMins}m</p>
                    </div>
                </div>
            </div>

            <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl md:rounded-2xl bg-blue-600 px-5 md:px-6 py-3 md:py-4 font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98] text-sm md:text-base"
            >
                <span>Join Contest</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
            </a>
        </motion.div>
    );
};

export default ContestCard;
