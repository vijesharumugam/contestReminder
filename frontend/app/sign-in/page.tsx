"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SignInPage() {
    const router = useRouter();
    const { login, register, isSignedIn, isLoaded } = useAuth();

    const [mode, setMode] = useState<"login" | "register">("register");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Redirect if already signed in — must be in useEffect, not during render
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push("/");
        }
    }, [isLoaded, isSignedIn, router]);

    // Show nothing while auth loads or if already signed in
    if (!isLoaded || isSignedIn) return null;

    const switchMode = (newMode: "login" | "register") => {
        setMode(newMode);
        setError("");
        setFullName("");
        setPassword("");
        setConfirmPassword("");
        setAgreedToTerms(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (mode === "register") {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }
            if (!agreedToTerms) {
                setError("You must agree to the Terms of Service.");
                return;
            }
        }

        setLoading(true);
        try {
            const result = mode === "login"
                ? await login(email, password, rememberMe)
                : await register(email, password);

            if (result.success) {
                router.push("/");
            } else {
                setError(result.error || "Something went wrong. Please try again.");
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-outfit font-bold text-xl tracking-tight">
                        Contest<span className="text-primary">Remind</span>
                    </span>
                </div>

                {/* Card */}
                <div className="bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 overflow-hidden">
                    <div className="p-6 space-y-5">

                        {/* Title */}
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                {mode === "register" ? "Create an account" : "Welcome back"}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {mode === "register"
                                    ? "Sign up to get started with contest reminders"
                                    : "Sign in to your account to continue"
                                }
                            </p>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 text-xs font-medium"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Full Name — register only */}
                            <AnimatePresence>
                                {mode === "register" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-1.5"
                                    >
                                        <label className="text-xs font-semibold text-foreground">Full Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Enter your full name"
                                                className="w-full border border-border bg-background rounded-lg px-3 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                                autoComplete="name"
                                            />
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full border border-border bg-background rounded-lg px-3 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                        autoComplete="email"
                                    />
                                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={mode === "register" ? "Create a strong password" : "Enter your password"}
                                        minLength={mode === "register" ? 6 : undefined}
                                        className="w-full border border-border bg-background rounded-lg px-3 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password — register only */}
                            <AnimatePresence>
                                {mode === "register" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-1.5"
                                    >
                                        <label className="text-xs font-semibold text-foreground">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm your password"
                                                className="w-full border border-border bg-background rounded-lg px-3 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                                autoComplete="new-password"
                                                required={mode === "register"}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Terms of Service — register only */}
                            <AnimatePresence>
                                {mode === "register" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-start gap-2.5"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                                            className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${agreedToTerms
                                                    ? "bg-primary border-primary"
                                                    : "border-border hover:border-primary/50 bg-background"
                                                }`}
                                        >
                                            {agreedToTerms && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                                        </button>
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            I agree to the{" "}
                                            <span className="text-primary font-medium cursor-pointer hover:underline">Terms of Service</span>
                                            {" "}and{" "}
                                            <span className="text-primary font-medium cursor-pointer hover:underline">Privacy Policy</span>
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Remember Me — login only */}
                            <AnimatePresence>
                                {mode === "login" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2.5"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setRememberMe(!rememberMe)}
                                            className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${rememberMe
                                                    ? "bg-primary border-primary"
                                                    : "border-border hover:border-primary/50 bg-background"
                                                }`}
                                        >
                                            {rememberMe && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                                        </button>
                                        <span className="text-xs text-muted-foreground">
                                            Remember me for 90 days
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Primary Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all text-sm shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {mode === "register" ? "Create Account" : "Sign In"}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* OR Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[11px] text-muted-foreground font-medium">OR</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Toggle Mode Button */}
                        <button
                            type="button"
                            onClick={() => switchMode(mode === "register" ? "login" : "register")}
                            className="w-full border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground font-semibold py-2.5 rounded-lg transition-all text-sm"
                        >
                            {mode === "register" ? "Sign In" : "Create Account"}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-muted/30 border-t border-border/60">
                        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                            By continuing, you agree to our{" "}
                            <span className="text-primary font-medium cursor-pointer hover:underline">Terms of Service</span>
                            {" "}and{" "}
                            <span className="text-primary font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
