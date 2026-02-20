// This hook is no longer needed with JWT auth.
// Users are automatically synced during register/login.
// Kept as a no-op for backward compatibility in case it's imported elsewhere.
export const useUserSync = () => {
    // No-op: JWT auth handles user creation during registration
};
