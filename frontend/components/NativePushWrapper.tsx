"use client";

import { useAuth } from "@/context/AuthContext";
import NativePushHandler from "./NativePushHandler";

/**
 * Client-side wrapper that provides the authenticated user's ID
 * to the NativePushHandler component.
 */
export default function NativePushWrapper() {
    const { isSignedIn, user } = useAuth();

    if (!isSignedIn || !user) return null;

    return <NativePushHandler userId={user._id} />;
}
