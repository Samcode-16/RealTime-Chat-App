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

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check')
      set({ authUser: res.data })
      // If authenticated, ensure socket is connected for realtime features
      if (res.data && !get().socket) {
        get().connectSocket(res.data._id);
      }
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
      // Connect socket after successful login
      if (res.data && !get().socket) get().connectSocket(res.data._id);
      toast.success('Logged in successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed')
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Initialize and connect socket.io client
  connectSocket: (userId) => {
    // Avoid creating multiple sockets
    if (get().socket) return;

    try {
      const socket = io(BASE_URL, { query: { userId }, transports: ['websocket'] });

      // Listen for online users update
      socket.on('getOnlineUsers', (users) => {
        set({ onlineUsers: users });
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        set({ socket: null, onlineUsers: [] });
      });

      socket.on('connect_error', (err) => {
        console.warn('Socket connect_error', err);
      });

      set({ socket });
    } catch (err) {
      console.error('Failed to initialize socket', err);
    }
  },

  // Disconnect socket when logging out
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },

  logout: async () => {
    try {
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
}));