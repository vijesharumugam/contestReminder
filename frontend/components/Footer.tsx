"use client";

import Link from "next/link";
import { Github, Twitter, Mail, Heart, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
    return (
        <footer className="mt-12 border-t border-border bg-background/50 backdrop-blur-xl">
            <div className="container mx-auto px-6 py-8 flex flex-col items-center gap-6">

                {/* Navigation Links */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                    {[
                        { name: "Home", href: "/" },
                        { name: "Contests", href: "/#contests" },
                        { name: "Calendar", href: "/calendar" },
                        { name: "Settings", href: "/settings" },
                        { name: "Privacy Policy", href: "#" },
                        { name: "Terms of Service", href: "#" }
                    ].map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-6">
                    <a href="https://github.com/VijeshArumugam" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                        <Github className="w-6 h-6" strokeWidth={1.5} />
                    </a>
                    <a href="https://x.com/Vijesh_Arumugam" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                        <Twitter className="w-6 h-6" strokeWidth={1.5} />
                    </a>
                    {/* Added typical icons from the screenshot example for completeness, though they might be placeholders */}
                    <a href="#" className="text-foreground hover:text-primary transition-colors">
                        <Linkedin className="w-6 h-6" strokeWidth={1.5} />
                    </a>
                    <a href="#" className="text-foreground hover:text-primary transition-colors">
                        <Instagram className="w-6 h-6" strokeWidth={1.5} />
                    </a>
                    <a href="mailto:vijesharumugam26@gmail.com" className="text-foreground hover:text-primary transition-colors">
                        <Mail className="w-6 h-6" strokeWidth={1.5} />
                    </a>
                </div>

                {/* Copyright */}
                <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground/60">
                        © {new Date().getFullYear()} ContestRemind. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground/40 flex items-center justify-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Vijesh Arumugam
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
