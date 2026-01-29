"use client";

/**
 * CSS-based loading spinner to replace lucide-react Loader2
 * This fixes HMR issues in Turbopack
 */
interface SpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
};

export const Spinner = ({ className = "", size = "md" }: SpinnerProps) => {
    return (
        <div
            className={`${sizeClasses[size]} ${className} animate-spin`}
            style={{
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                opacity: 0.8
            }}
        />
    );
};

export default Spinner;
