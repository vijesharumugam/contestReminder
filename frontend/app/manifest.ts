import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Contest Reminder',
        short_name: 'CReminder',
        description:
            'Track coding contests from Codeforces, CodeChef, LeetCode, and more. Never miss a competitive programming contest again.',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        orientation: 'portrait-primary',
        categories: ['education', 'productivity', 'utilities'],
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
