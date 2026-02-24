import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | ContestRemind",
    description: "Read the terms and conditions for using the ContestRemind platform.",
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
