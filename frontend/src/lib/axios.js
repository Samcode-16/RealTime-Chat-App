import axios from "axios";

export const axiosInstance = axios.create({
    // Fixed typo: "localhoast" -> "localhost"
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
    withCredentials: true,
});
