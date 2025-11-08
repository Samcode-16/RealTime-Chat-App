import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhoast:5001/api" : "/api",
    withCredentials: true,
});
