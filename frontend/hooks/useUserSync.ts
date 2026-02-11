import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import api from '@/lib/api';

export const useUserSync = () => {
    const { user, isSignedIn } = useUser();

    useEffect(() => {
        const syncUser = async () => {
            if (isSignedIn && user) {
                try {
                    await api.post(`/api/users/sync`, {
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
