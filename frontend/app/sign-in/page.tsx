"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
    const router = useRouter();
    const { login, register, isSignedIn, isLoaded } = useAuth();

    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push("/");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || isSignedIn) return null;

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
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
            if (!agreeTerms) {
                setError("Accept the Terms and Privacy Policy to continue.");
                return;
            }
        }

        setLoading(true);
        try {
            const result =
                mode === "login"
                    ? await login(email, password, rememberMe)
                    : await register(email, password);

            if (result.success) {
                router.push("/");
            } else {
                setError(result.error || "Authentication failed. Please try again.");
            }
        } catch {
            setError("Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto grid min-h-[84vh] w-full max-w-5xl items-center gap-4 px-2 py-6 md:grid-cols-[1.05fr_1fr] md:px-0">
            <section className="glass hidden rounded-3xl p-8 md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">ContestRemind</p>
                <h1 className="mt-2 text-3xl font-bold text-foreground">Stay ahead of every contest window</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Monitor daily schedules, sync important rounds, and receive delivery-ready reminders across channels.
                </p>

                <div className="mt-6 space-y-3">
                    {[
                        "Unified timeline for major coding platforms",
                        "Telegram and app notification controls",
                        "Secure account management and audit-friendly settings",
                    ].map((item) => (
                        <div key={item} className="rounded-xl border border-border bg-background/65 px-3 py-2 text-xs font-medium text-muted-foreground">
                            {item}
                        </div>
                    ))}
                </div>
            </section>

            <section className="glass rounded-3xl p-5 md:p-7">
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-foreground">{mode === "login" ? "Sign in" : "Create account"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {mode === "login" ? "Use your account credentials to continue." : "Set up your account to start receiving reminders."}
                    </p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={onSubmit} className="space-y-3.5">
                    <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-foreground">Email</span>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/50"
                            />
                            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        </div>
                    </label>

                    <label className="block space-y-1.5">
                        <span className="text-xs font-semibold text-foreground">Password</span>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete={mode === "login" ? "current-password" : "new-password"}
                                placeholder={mode === "login" ? "Enter your password" : "Minimum 6 characters"}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </label>

                    {mode === "register" && (
                        <label className="block space-y-1.5">
                            <span className="text-xs font-semibold text-foreground">Confirm password</span>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Re-enter your password"
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </label>
                    )}

                    {mode === "login" ? (
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={() => setRememberMe((prev) => !prev)}
                                className="h-4 w-4 rounded border-border accent-primary"
                            />
                            Keep me signed in
                        </label>
                    ) : (
                        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={() => setAgreeTerms((prev) => !prev)}
                                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                            />
                            <span>
                                I agree to the{" "}
                                <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
                            </span>
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        ) : (
                            <>
                                <Lock className="h-4 w-4" />
                                {mode === "login" ? "Sign in" : "Create account"}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                    {mode === "login" ? "New to ContestRemind?" : "Already have an account?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setMode((prev) => (prev === "login" ? "register" : "login"));
                            setError("");
                            setPassword("");
                            setConfirmPassword("");
                        }}
                        className="font-semibold text-primary hover:underline"
                    >
                        {mode === "login" ? "Create account" : "Sign in"}
                    </button>
                </div>
            </section>
        </div>
    );
}
