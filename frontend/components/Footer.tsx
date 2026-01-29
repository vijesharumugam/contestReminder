"use client";

import Link from "next/link";
import { Trophy, Github, Twitter, Mail, Heart } from "lucide-react";

const Footer = () => {
    return (
        <footer className="mt-20 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-outfit font-bold text-xl tracking-tight">
                                Contest<span className="text-blue-500">Remind</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
                            The ultimate companion for competitive programmers. Track upcoming contests,
                            set smart reminders, and never miss a coding match again.
                            Built for the global developer community.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { icon: Github, href: "#" },
                                { icon: Twitter, href: "#" },
                                { icon: Mail, href: "mailto:support@contestremind.com" }
                            ].map((social, i) => (
                                <a key={i} href={social.href} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-outfit font-bold text-white mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            {[
                                { name: "Home", href: "/" },
                                { name: "Contests", href: "/#contests" },
                                { name: "Settings", href: "/settings" },
                                { name: "Sign In", href: "/sign-in" }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-slate-400 hover:text-blue-500 transition-colors text-sm font-medium">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-outfit font-bold text-white mb-6">Platforms</h4>
                        <ul className="space-y-4">
                            {["Codeforces", "CodeChef", "LeetCode", "AtCoder", "HackerRank"].map((p) => (
                                <li key={p}>
                                    <span className="text-slate-400 text-sm font-medium">
                                        {p}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-medium">
                        © {new Date().getFullYear()} ContestRemind. All rights reserved.
                    </p>
                    <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by <span className="text-slate-300">Vijesh Arumugam</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
