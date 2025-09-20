import axios from "axios";

export const fastapi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000",
  timeout: 15000,
});

fastapi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

fastapi.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);
