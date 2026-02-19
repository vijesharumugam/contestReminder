"use client";

import { useAuth } from "@clerk/nextjs";
import NativePushHandler from "./NativePushHandler";

/**
 * Client-side wrapper that provides the authenticated user's ID
 * to the NativePushHandler component.
 */
export default function NativePushWrapper() {
    const { userId, isSignedIn } = useAuth();

    if (!isSignedIn || !userId) return null;

    return <NativePushHandler userId={userId} />;
}
