import { create } from 'zustand' // State management library
import { axiosInstance } from '../lib/axios.js' // Pre-configured axios for API calls
import toast from 'react-hot-toast' // Library for showing toast notifications
import { io } from "socket.io-client"; // Socket.io client for real-time communication

const BASE_URL = "http://localhost:5001";

// Zustand store for authentication state and actions
// This is similar to Redux but much simpler - it manages global state
export const useAuthStore = create((set, get) => ({
  // STATE: Store user authentication data
  authUser: null, // Stores logged-in user info (null if not logged in)
  isSigningUp: false, // Loading state for signup process
  isLoggingIn: false, // Loading state for login process
  isUpdatingProfile: false, // Loading state for profile update
  isCheckingAuth: true, // Loading state while checking if user is authenticated
  onlineUsers: [], // Array of user IDs who are currently online
  socket: null, // Socket.io connection instance for real-time features

  // ACTION: Check if user is already authenticated (called when app loads)
  checkAuth: async () => {
    try {
      // Make API request to backend to verify if user has valid session
      const res = await axiosInstance.get('/auth/check')

      // Update state with authenticated user data
      set({ authUser: res.data })
      
      // Establish socket connection for real-time features
      get().connectSocket()

    } catch (error) {
      const status = error?.response?.status
      if (status === 401) {
        // 401 = Unauthorized - user is not logged in
        if (import.meta.env.DEV) {
          // Development mode: use mock user for testing
          set({
            authUser: {
              _id: 'dev-user',
              fullName: 'Dev User',
              email: 'dev@example.com',
              profilePic: '/avatar.png',
            },
          })
        } else {
          // Production mode: set user to null (not logged in)
          set({ authUser: null })
        }
      } else {
        // Other errors - log and set user to null
        console.error('Auth check failed:', error)
        set({ authUser: null })
      }
    } finally {
      // Always set loading state to false when check completes
      set({ isCheckingAuth: false })
    }
  },

  // ACTION: Register a new user account
  signup: async (data) => {
    try {
      set({ isSigningUp: true }) // Show loading state
      
      // Send signup data to backend API
      const res = await axiosInstance.post('/auth/signup', data)
      
      // Update state with newly created user
      set({ authUser: res.data })
      toast.success('Account created successfully!')

      // Connect to socket for real-time features after signup
      get().connectSocket();
    } catch (error) {
      // Show error message to user
      toast.error(error?.response?.data?.message || 'Signup failed')
    } finally {
      set({ isSigningUp: false }) // Hide loading state
    }
  },

  // ACTION: Login an existing user
  login: async (data) => {
    set({ isLoggingIn: true }) // Show loading state
    try {
      // Send login credentials to backend
      const res = await axiosInstance.post('/auth/login', data)
      
      // Update state with logged-in user data
      set({ authUser: res.data })
      toast.success('Logged in successfully')

      // Connect to socket for real-time features after login
      get().connectSocket();
    } catch (error) {
      // Show error message to user
      toast.error(error?.response?.data?.message || 'Login failed')
    } finally {
      set({ isLoggingIn: false }); // Hide loading state
    }
  },

  // ACTION: Logout current user
  logout: async () => {
    try {
      // Notify backend to clear session/cookies
      await axiosInstance.post('/auth/logout')
      
      // Clear user data from state
      set({ authUser: null })
      toast.success('Logged out successfully')
      
      // Disconnect socket when user logs out
      get().disconnectSocket();

    } catch (error) {
      toast.error(error?.response?.data?.message || 'Logout failed')
    }
  },

  // ACTION: Update user's profile picture
  updateProfile: async(imageFile) => {
    set({ isUpdatingProfile: true }); // Show loading state
    try {
      // Create form data to send file to backend
      const formData = new FormData();
      formData.append("profilePic", imageFile);

      // Send image to backend for upload (e.g., to Cloudinary)
      const res = await axiosInstance.patch("/auth/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Required for file uploads
        },
      });

      // Update state with new user data (includes new profile pic URL)
      set({ authUser: res.data });
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't update profile picture");
    } finally {
      set({ isUpdatingProfile: false }); // Hide loading state
    }
  },

  // ACTION: Establish WebSocket connection for real-time features
  connectSocket: () => {
    const {authUser} = get() // Get current user from state
    
    // Don't connect if no user is logged in or already connected
    if(!authUser || get().socket?.connected) return;

    // Create socket connection with user ID for identification
    const socket = io(BASE_URL, {
      query:  {
        userId: authUser._id, // Send user ID to backend
      },
    })
    socket.connect();

    // Store socket instance in state
    set({ socket: socket });

    // LISTENER: Listen for online users updates from backend
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds}) // Update state with online user IDs
    });
  },

  // ACTION: Disconnect WebSocket when user logs out
  disconnectSocket: () => {
    if(get().socket?.connected)
      get().socket.disconnect();
  },
}));

