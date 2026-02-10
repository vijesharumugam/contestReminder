import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Contest Reminder',
        short_name: 'CReminder',
        description:
            'Track coding contests from Codeforces, CodeChef, LeetCode, and more. Never miss a competitive programming contest again.',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        orientation: 'portrait-primary',
        categories: ['education', 'productivity', 'utilities'],
        icons: [
            {
                src: '/icons/icon-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icons/icon-maskable-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
    };
}
