"use client";

import { Calendar, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Contest {
    _id: string;
    name: string;
    platform: string;
    startTime: string;
    duration: number;
    url: string;
}

const platformStyle = (platform: string) => {
    const key = platform.toLowerCase();
    if (key.includes("codeforces")) return "border-red-500/25 bg-red-500/8 text-red-600 dark:text-red-300";
    if (key.includes("codechef")) return "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300";
    if (key.includes("leetcode")) return "border-orange-500/25 bg-orange-500/8 text-orange-700 dark:text-orange-300";
    if (key.includes("atcoder")) return "border-slate-500/25 bg-slate-500/8 text-slate-700 dark:text-slate-300";
    return "border-primary/25 bg-primary/8 text-primary";
};

const ContestCard = ({ contest }: { contest: Contest }) => {
    const startDate = new Date(contest.startTime);
    const hours = Math.floor(contest.duration / 3600);
    const minutes = Math.floor((contest.duration % 3600) / 60);

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            data-testid="contest-card"
            className="glass glass-hover group rounded-2xl p-4 md:p-5"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", platformStyle(contest.platform))}>
                    {contest.platform}
                </span>
                <a
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border bg-background/75 p-2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Open contest details"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>

            <h3 className="line-clamp-2 min-h-[2.8rem] text-sm font-bold text-foreground md:min-h-[3rem] md:text-base">
                {contest.name}
            </h3>

            <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/45 px-3 py-2.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Start</p>
                        <p className="text-xs font-semibold text-foreground">{format(startDate, "EEE, MMM d, p")}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/45 px-3 py-2.5">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Duration</p>
                        <p className="text-xs font-semibold text-foreground">{hours}h {minutes}m</p>
                    </div>
                </div>
            </div>

            <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-primary bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/92"
            >
                View contest
            </a>
        </motion.article>
    );
};

export default ContestCard;
