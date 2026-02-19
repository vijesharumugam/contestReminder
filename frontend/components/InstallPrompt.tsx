"use client";

import { Download, X, Share, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInstall } from "@/context/InstallContext";

export default function InstallPrompt() {
    const { platform, showPrompt, setShowPrompt, installApp } = useInstall();

    const handleDismiss = () => {
        setShowPrompt(false);
        if (platform === 'ios') {
            sessionStorage.setItem('iosInstallPromptSeen', 'true');
        } else if (platform === 'android') {
            sessionStorage.setItem('androidInstallPromptSeen', 'true');
        } else {
            sessionStorage.setItem('desktopInstallPromptSeen', 'true');
        }
    };

    const getPromptContent = () => {
        switch (platform) {
            case 'android':
                return {
                    icon: <Smartphone className="w-6 h-6 text-white" />,
                    title: 'Get the App',
                    description: 'Download our native Android app for the best experience with push notifications and faster performance.',
                    buttonText: 'Download App',
                };
            case 'ios':
                return {
                    icon: <Download className="w-6 h-6 text-white" />,
                    title: 'Install App',
                    description: "Install for the best experience. Tap the share button below and select 'Add to Home Screen'.",
                    buttonText: '',
                };
            default:
                return {
                    icon: <Download className="w-6 h-6 text-white" />,
                    title: 'Install App',
                    description: 'Install our app for a better experience with fullscreen mode and offline access.',
                    buttonText: 'Install Now',
                };
        }
    };

    const content = getPromptContent();

    // specific logic for when not to show (e.g. if platform is native) is handled in context or here
    if (platform === 'native') return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
                >
                    <div className="glass p-4 rounded-3xl border-t border-border shadow-2xl relative overflow-hidden backdrop-blur-xl bg-popover/80">
                        {/* Background Gradient Mesh */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -z-10" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                                {content.icon}
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h3 className="font-bold text-foreground text-base font-outfit">{content.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {content.description}
                                </p>
                            </div>
                        </div>

                        {platform === 'ios' ? (
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
                                <Share className="w-4 h-4 text-blue-400" />
                                <span>Tap <span className="font-bold text-foreground">Share</span> then <span className="font-bold text-foreground">Add to Home Screen</span></span>
                            </div>
                        ) : (
                            <button
                                onClick={installApp}
                                className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                            >
                                {platform === 'android' ? (
                                    <Smartphone className="w-4 h-4" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {content.buttonText}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
