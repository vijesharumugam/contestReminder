"use client";

import { motion } from "framer-motion";
import { Gavel, CheckCircle2, AlertCircle, Info, Scale, HelpCircle } from "lucide-react";

export default function TermsOfService() {
    const sections = [
        {
            icon: <Gavel className="w-5 h-5 text-primary" />,
            title: "Acceptance of Terms",
            content: "By accessing or using ContestRemind, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
        },
        {
            icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
            title: "User Accounts",
            content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account."
        },
        {
            icon: <Scale className="w-5 h-5 text-primary" />,
            title: "Service Description",
            content: "ContestRemind provides information about competitive programming contests and tools to set reminders. While we strive for accuracy, we do not warrant that contest information is always up-to-date or error-free."
        },
        {
            icon: <AlertCircle className="w-5 h-5 text-primary" />,
            title: "Limitation of Liability",
            content: "In no event shall ContestRemind or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ContestRemind's website."
        },
        {
            icon: <Info className="w-5 h-5 text-primary" />,
            title: "Intellectual Property",
            content: "The service and its original content, features, and functionality are and will remain the exclusive property of ContestRemind and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent."
        },
        {
            icon: <HelpCircle className="w-5 h-5 text-primary" />,
            title: "Governing Law",
            content: "These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location."
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
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">Terms of Service</h1>
                    <p className="text-muted-foreground">Last Updated: February 23, 2026</p>
                </div>

                <div className="glass rounded-3xl p-8 md:p-12 border border-border/50">
                    <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                        Please read these Terms of Service carefully before using the ContestRemind platform. Your access to and use of the service is conditioned on your acceptance of and compliance with these terms.
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
                            By using our service, you acknowledge that you have read and understood these Terms of Service. If you have any questions, please contact us at{" "}
                            <a href="mailto:support@contestremind.com" className="text-primary hover:underline font-medium">
                                support@contestremind.com
                            </a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
