"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, Bell, Globe } from "lucide-react";

export default function PrivacyPolicy() {
    const sections = [
        {
            icon: <Shield className="w-5 h-5 text-primary" />,
            title: "Information We Collect",
            content: "We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us for support. This may include your name, email address, and notification preferences."
        },
        {
            icon: <Lock className="w-5 h-5 text-primary" />,
            title: "How We Use Your Information",
            content: "We use the information we collect to provide, maintain, and improve our services, including sending you contest reminders, personalizing your experience, and communicating with you about updates and new features."
        },
        {
            icon: <Eye className="w-5 h-5 text-primary" />,
            title: "Information Sharing and Disclosure",
            content: "We do not share your personal information with third parties except as described in this policy. We may share information with service providers who perform services on our behalf, or when required by law."
        },
        {
            icon: <Bell className="w-5 h-5 text-primary" />,
            title: "Your Choices",
            content: "You can manage your notification preferences and account settings at any time through the app. You may also opt-out of receiving promotional communications from us by following the instructions in those communications."
        },
        {
            icon: <Globe className="w-5 h-5 text-primary" />,
            title: "International Data Transfers",
            content: "Your information may be transferred to, and maintained on, computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those from your jurisdiction."
        },
        {
            icon: <FileText className="w-5 h-5 text-primary" />,
            title: "Changes to This Policy",
            content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date."
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
            >
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last Updated: February 23, 2026</p>
                </div>

                <div className="glass rounded-3xl p-8 md:p-12 border border-border/50">
                    <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                        At ContestRemind, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
                    </p>

                    <div className="space-y-10">
                        {sections.map((section, index) => (
                            <motion.section
                                key={section.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-11">
                                    {section.content}
                                </p>
                            </motion.section>
                        ))}
                    </div>

                    <div className="mt-16 pt-8 border-t border-border/50 text-center">
                        <p className="text-muted-foreground">
                            If you have any questions about this Privacy Policy, please contact us at{" "}
                            <a href="mailto:privacy@contestremind.com" className="text-primary hover:underline font-medium">
                                privacy@contestremind.com
                            </a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
