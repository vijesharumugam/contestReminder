import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Create axios instance with retry logic for Render cold starts
const api = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000, // 30s timeout for cold starts
});

// Retry interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Only retry on network errors or 5xx server errors
        const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
        const isServerError = error.response?.status >= 500;

        if ((isNetworkError || isServerError) && (!config._retryCount || config._retryCount < 3)) {
            config._retryCount = (config._retryCount || 0) + 1;

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, config._retryCount - 1) * 1000;
            console.log(`[API] Retry ${config._retryCount}/3 after ${delay}ms — ${config.url}`);

            await new Promise((resolve) => setTimeout(resolve, delay));
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;
export { BACKEND_URL };
