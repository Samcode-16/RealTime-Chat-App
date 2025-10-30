import axios from 'axios'

// Allow overriding the API base URL via Vite env var `VITE_API_BASE_URL`.
// Falls back to the commonly used backend dev port. If you see "connection refused",
// make sure the backend is running or set VITE_API_BASE_URL in your .env file.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

export const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
})

// Helpful developer message in case the backend isn't running.
if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[axios] API baseURL =', baseURL)
}