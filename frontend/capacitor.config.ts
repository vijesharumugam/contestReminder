import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.contestreminder.app',
    appName: 'Contest Reminder',

    // Minimal local fallback directory (required by Capacitor)
    webDir: 'www',

    // ===== LIVE URL MODE =====
    // The app loads your deployed Vercel website inside a native shell.
    // This means: website + native app share the same codebase automatically.
    // UPDATE THIS to your actual Vercel deployment URL.
    server: {
        url: 'https://contest-reminder-pi.vercel.app',
        cleartext: true,  // Allow HTTP for development (HTTPS works by default)
    },

    // Android-specific configuration
    android: {
        // Use dark splash/status bar to match your app theme
        backgroundColor: '#020617',
        allowMixedContent: true,
    },

    // Plugins configuration
    plugins: {
        // Splash Screen
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#020617',
            showSpinner: true,
            spinnerColor: '#3b82f6',
            androidScaleType: 'CENTER_CROP',
        },
        // Status Bar
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#020617',
        },
    },
};

export default config;
