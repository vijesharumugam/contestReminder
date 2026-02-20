"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

// ============================================
// TYPES
// ============================================
interface User {
    _id: string;
    email: string;
    role: string;
    telegramChatId?: string;
    fcmTokens?: string[];
    pushSubscriptions?: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
    preferences: {
        push: boolean;
        telegram: boolean;
    };
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    isLoaded: boolean;
    isSignedIn: boolean;
    isAdmin: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (data: { email: string }) => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// CONTEXT
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "cr_access_token";
const REFRESH_TOKEN_KEY = "cr_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    // ============================================
    // TOKEN HELPERS
    // ============================================
    const saveTokens = (accessToken: string, refreshToken: string) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    };

    const clearTokens = () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        delete api.defaults.headers.common["Authorization"];
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    };

    const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
    const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

    // Decode JWT to get expiry time (without verification - frontend only)
    const getTokenExpiry = (token: string): number | null => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp ? payload.exp * 1000 : null; // Convert to ms
        } catch {
            return null;
        }
    };

    // ============================================
    // SILENT TOKEN REFRESH
    // ============================================
    const silentRefresh = useCallback(async (): Promise<boolean> => {
        if (isRefreshingRef.current) return false;
        isRefreshingRef.current = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            isRefreshingRef.current = false;
            return false;
        }

        try {
            // Use a clean axios call (no interceptor) to avoid infinite loops
            const res = await api.post("/api/auth/refresh", { refreshToken });
            const { accessToken: newAccess, refreshToken: newRefresh, user: userData } = res.data;

            saveTokens(newAccess, newRefresh);
            setUser(userData);
            scheduleRefresh(newAccess);

            return true;
        } catch (error: any) {
            console.error("[Auth] Silent refresh failed:", error?.response?.data?.error || error.message);

            // If refresh token is expired or invalid, force logout
            if (error?.response?.status === 401) {
                clearTokens();
                setUser(null);
            }
            return false;
        } finally {
            isRefreshingRef.current = false;
        }
    }, []);

    // Schedule next refresh 1 minute before access token expires
    const scheduleRefresh = useCallback((accessToken: string) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        const expiry = getTokenExpiry(accessToken);
        if (!expiry) return;

        const now = Date.now();
        const timeUntilRefresh = expiry - now - 60 * 1000; // Refresh 1 min before expiry

        if (timeUntilRefresh <= 0) {
            // Token is about to expire or already expired — refresh immediately
            silentRefresh();
            return;
        }

        refreshTimerRef.current = setTimeout(() => {
            silentRefresh();
        }, timeUntilRefresh);
    }, [silentRefresh]);

    // ============================================
    // AXIOS INTERCEPTOR — Auto-refresh on 401
    // ============================================
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If we get a 401 with TOKEN_EXPIRED and haven't retried yet
                if (
                    error.response?.status === 401 &&
                    error.response?.data?.code === 'TOKEN_EXPIRED' &&
                    !originalRequest._retry &&
                    !originalRequest.url?.includes('/auth/refresh') // Don't retry refresh calls
                ) {
                    originalRequest._retry = true;

                    const refreshed = await silentRefresh();
                    if (refreshed) {
                        // Retry the original request with the new token
                        originalRequest.headers["Authorization"] = `Bearer ${getAccessToken()}`;
                        return api(originalRequest);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [silentRefresh]);

    // ============================================
    // INITIALIZATION — Load tokens on mount
    // ============================================
    useEffect(() => {
        const initAuth = async () => {
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();

            if (!accessToken && !refreshToken) {
                setIsLoaded(true);
                return;
            }

            // If we have an access token, try to use it
            if (accessToken) {
                const expiry = getTokenExpiry(accessToken);
                const isExpired = !expiry || expiry < Date.now();

                if (!isExpired) {
                    // Token still valid — fetch user
                    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                    try {
                        const res = await api.get("/api/auth/me");
                        setUser(res.data);
                        scheduleRefresh(accessToken);
                        setIsLoaded(true);
                        return;
                    } catch {
                        // Token invalid on server side — try refresh
                    }
                }
            }

            // Access token expired or invalid — try refresh
            if (refreshToken) {
                const refreshed = await silentRefresh();
                if (!refreshed) {
                    clearTokens();
                }
            }

            setIsLoaded(true);
        };

        initAuth();

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [scheduleRefresh, silentRefresh]);

    // ============================================
    // AUTH ACTIONS
    // ============================================
    const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            const res = await api.post("/api/auth/login", { email, password, rememberMe });
            const { accessToken, refreshToken, user: userData } = res.data;

            saveTokens(accessToken, refreshToken);
            setUser(userData);
            scheduleRefresh(accessToken);

            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || "Login failed. Please try again.";
            return { success: false, error: message };
        }
    }, [scheduleRefresh]);

    const register = useCallback(async (email: string, password: string) => {
        try {
            const res = await api.post("/api/auth/register", { email, password });
            const { accessToken, refreshToken, user: userData } = res.data;

            saveTokens(accessToken, refreshToken);
            setUser(userData);
            scheduleRefresh(accessToken);

            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || "Registration failed. Please try again.";
            return { success: false, error: message };
        }
    }, [scheduleRefresh]);

    const logout = useCallback(() => {
        clearTokens();
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const accessToken = getAccessToken();
        if (!accessToken) return;

        try {
            api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
            const res = await api.get("/api/auth/me");
            setUser(res.data);
        } catch {
            // If this fails, the interceptor will handle the refresh
        }
    }, []);

    const updateUser = useCallback((userData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...userData } : null);
    }, []);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        try {
            const res = await api.put("/api/auth/change-password", { currentPassword, newPassword });
            const { accessToken, refreshToken } = res.data;

            if (accessToken && refreshToken) {
                saveTokens(accessToken, refreshToken);
                scheduleRefresh(accessToken);
            }

            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || "Failed to change password.";
            return { success: false, error: message };
        }
    }, [scheduleRefresh]);

    const updateProfile = useCallback(async (data: { email: string }) => {
        try {
            const res = await api.put("/api/auth/profile", data);
            setUser(res.data);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || "Failed to update profile.";
            return { success: false, error: message };
        }
    }, []);

    const deleteAccount = useCallback(async (password: string) => {
        try {
            await api.delete("/api/auth/account", { data: { password } });
            clearTokens();
            setUser(null);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.error || "Failed to delete account.";
            return { success: false, error: message };
        }
    }, []);

    // ============================================
    // DERIVED STATE
    // ============================================
    const isSignedIn = !!user;
    const isAdmin = user?.role === "admin";

    return (
        <AuthContext.Provider value={{
            user,
            isLoaded,
            isSignedIn,
            isAdmin,
            login,
            register,
            logout,
            refreshUser,
            updateUser,
            changePassword,
            updateProfile,
            deleteAccount,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
