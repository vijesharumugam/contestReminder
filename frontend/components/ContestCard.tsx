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
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-500/20',
            glow: 'group-hover:shadow-red-500/20'
        };
        if (p.includes('codechef')) return {
            bg: 'from-orange-500/10 to-orange-600/10',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-500/20',
            glow: 'group-hover:shadow-orange-500/20'
        };
        if (p.includes('leetcode')) return {
            bg: 'from-yellow-500/10 to-yellow-600/10',
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-500/20',
            glow: 'group-hover:shadow-yellow-500/20'
        };
        return {
            bg: 'from-blue-500/10 to-blue-600/10',
            text: 'text-blue-600 dark:text-blue-400',
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
            className={`group relative glass rounded-xl md:rounded-2xl p-3 md:p-5 transition-all duration-500 border ${styles.border} ${styles.glow} hover:shadow-2xl`}
        >
            {/* Background Glow */}
            <div className={`absolute -inset-1 bg-gradient-to-br ${styles.bg} rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10`} />

            <div className="flex justify-between items-start mb-3 md:mb-5">
                <div className={`px-2.5 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black tracking-widest uppercase border ${styles.border} ${styles.text} bg-background/80 backdrop-blur-md`}>
                    {contest.platform}
                </div>
                <a
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </a>
            </div>

            <h3 className="text-sm md:text-lg font-bold font-outfit text-foreground mb-3 md:mb-5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] md:min-h-[3rem]">
                {contest.name}
            </h3>

            {/* Mobile: horizontal layout, Desktop: stacked */}
            <div className="flex gap-2 md:flex-col md:gap-3 mb-3 md:mb-6">
                <div className="flex-1 flex items-center gap-2.5 text-muted-foreground bg-muted/50 p-2 md:p-2.5 rounded-lg md:rounded-xl border border-border">
                    <div className="p-1 md:p-1.5 bg-blue-500/10 rounded-md">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Starts At</p>
                        <p className="text-[10px] md:text-xs font-semibold truncate text-foreground">{format(startDate, "EEE, MMM do · p")}</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-2.5 text-muted-foreground bg-muted/50 p-2 md:p-2.5 rounded-lg md:rounded-xl border border-border">
                    <div className="p-1 md:p-1.5 bg-purple-500/10 rounded-md">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 dark:text-purple-500" />
                    </div>
                    <div>
                        <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Duration</p>
                        <p className="text-[10px] md:text-xs font-semibold uppercase text-foreground">{durationHours}h {durationMins}m</p>
                    </div>
                </div>
            </div>

            <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl md:rounded-xl bg-primary px-4 md:px-5 py-2.5 md:py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] text-xs md:text-sm"
            >
                <span>Join Contest</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
            </a>
        </motion.div>
    );
};

export default ContestCard;
