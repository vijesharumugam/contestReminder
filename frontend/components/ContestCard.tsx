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
            className={`group relative glass rounded-3xl p-6 transition-all duration-500 border ${styles.border} ${styles.glow} hover:shadow-2xl`}
        >
            {/* Background Glow */}
            <div className={`absolute -inset-1 bg-gradient-to-br ${styles.bg} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10`} />

            <div className="flex justify-between items-start mb-6">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${styles.border} ${styles.text} bg-slate-900/50 backdrop-blur-md`}>
                    {contest.platform}
                </div>
                <div className="flex gap-2">

                    <a
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            <h3 className="text-xl font-bold font-outfit text-white mb-6 group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[3.5rem]">
                {contest.name}
            </h3>

            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-slate-400 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Starts At</p>
                        <p className="text-sm font-semibold">{format(startDate, "EEE, MMM do · p")}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration</p>
                        <p className="text-sm font-semibold uppercase">{durationHours}h {durationMins}m</p>
                    </div>
                </div>
            </div>

            <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98]"
            >
                <span>Join Contest</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </a>
        </motion.div>
    );
};

export default ContestCard;

