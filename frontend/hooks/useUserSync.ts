import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';

export const useUserSync = () => {
    const { user, isSignedIn } = useUser();

    useEffect(() => {
        const syncUser = async () => {
            if (isSignedIn && user) {
                try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                    await axios.post(`${backendUrl}/api/users/sync`, {
                        clerkId: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                    });
                } catch (error) {
                    console.error("Failed to sync user:", error);
                }
            }
        };

        syncUser();
    }, [isSignedIn, user]);
};
