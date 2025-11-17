import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import toast from 'react-hot-toast';
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development"  ? "http://localhost:5001" : "/";


export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // Initialize Socket.IO client when user is authenticated
  initSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket) return;

    try {
      const s = io(BASE_URL, {
        query: { userId: authUser._id },
        withCredentials: true,
      });

      // Store socket instance
      set({ socket: s });

      // Receive online users list from server
      s.on("getOnlineUsers", (onlineIds) => {
        set({ onlineUsers: Array.isArray(onlineIds) ? onlineIds : [] });
      });

      // Clean up local state when socket disconnects
      s.on("disconnect", () => {
        // Keep socket reference; server will re-emit when reconnected
      });
    } catch (e) {
      console.error("Socket init failed:", e);
    }
  },

  // Close socket and reset online list
  cleanupSocket: () => {
    const s = get().socket;
    if (s) {
      try {
        s.off("getOnlineUsers");
        s.close();
      } catch {}
    }
    set({ socket: null, onlineUsers: [] });
  },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check')
      set({ authUser: res.data })
      // Once authenticated, connect socket
      get().initSocket();
    } catch (error) {
      // If user is not authenticated, backend returns 401 — treat that as not-logged-in silently.
      const status = error?.response?.status
      if (status === 401) {
        // In dev, provide a mock user so UI development can proceed without sign-in.
        if (import.meta.env.DEV) {
          set({
            authUser: {
              _id: 'dev-user',
              fullName: 'Dev User',
              email: 'dev@example.com',
              profilePic: '/avatar.png',
            },
          })
          get().initSocket();
        } else {
          set({ authUser: null })
        }
      } else {
        console.error('Auth check failed:', error)
        set({ authUser: null })
      }
    } finally {
      set({ isCheckingAuth: false })
    }
  },

  signup: async (data) => {
    try {
      set({ isSigningUp: true })
      const res = await axiosInstance.post('/auth/signup', data)
      set({ authUser: res.data })
      get().initSocket();
      toast.success('Account created successfully!')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Signup failed')
    } finally {
      set({ isSigningUp: false })
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true })
    try {
      const res = await axiosInstance.post('/auth/login', data)
      set({ authUser: res.data })
      get().initSocket();
      toast.success('Logged in successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed')
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      // Close socket before logging out
      get().cleanupSocket();
      await axiosInstance.post('/auth/logout')
      set({ authUser: null })
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Logout failed')
    }
  },

  updateProfile: async(imageFile) => {
    set({ isUpdatingProfile: true });
    try {
      const formData = new FormData();
      formData.append("profilePic", imageFile);

      const res = await axiosInstance.patch("/auth/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({ authUser: res.data });
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't update profile picture");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // update name and bio
  updateProfileInfo: async (payload) => {
    try {
      const res = await axiosInstance.patch("/auth/update-info", payload);
      set({ authUser: res.data });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't update profile");
    }
  },
}));