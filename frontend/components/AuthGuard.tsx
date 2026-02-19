"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-side auth guard — replaces server middleware for protected pages.
 * Wrap any page that requires login with this component.
 * 
 * Usage:
 *   <AuthGuard>
 *     <YourProtectedContent />
 *   </AuthGuard>
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Once Clerk finishes loading, if the user is NOT signed in → redirect
        if (isLoaded && !isSignedIn) {
            router.push("/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    // Still loading auth state → show spinner
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Auth loaded but NOT signed in → don't render anything (redirect is happening)
    if (!isSignedIn) {
        return null;
    }

    // ✅ Signed in → render the protected content
    return <>{children}</>;
}
