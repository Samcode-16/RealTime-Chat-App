import { create } from "zustand";            // State management library
import toast from "react-hot-toast";          // Library for showing toast notifications
import { axiosInstance } from "../lib/axios"; // Pre-configured axios for API calls
import { useAuthStore } from "./useAuthstore";


// Zustand store for chat-related state and actions
// This manages all chat functionality (messages, users, selections)
export const useChatStore = create((set, get) => ({
    // STATE: Store chat data
    messages: [],                    // Array of messages in current conversation
    users: [],                       // Array of all available users to chat with
    selectedUser: null,              // Currently selected user for chatting
    isUsersLoading: false,           // Loading state while fetching users
    isMessagesLoading: false,        // Loading state while fetching messages

    // ACTION: Fetch all users available for chat (called in Sidebar)
    getUsers: async () => {
        set({ isUsersLoading: true }); // Show loading state
        try {
            // Request list of users from backend
            const res = await axiosInstance.get("/messages/users");
            
            // Update state with fetched users
            set({ users: res.data });
        } catch (error) {
            // Show error notification to user
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false }); // Hide loading state
        }
    },

    // ACTION: Fetch messages for a specific user (called when user is selected)
    getMessages: async(userId) => {
        set({ isMessagesLoading: true }); // Show loading state
        try {
            // Request conversation history with specific user
            const res = await axiosInstance.get(`/messages/${userId}`);
            
            // Update state with fetched messages
            set({ messages: res.data });
        } catch (error) {
            // Show error notification to user
            toast.error(error.response.data.message);
        } finally {
            set({ isMessagesLoading: false }); // Hide loading state
        }
    },

    // ACTION: Send a new message (called from MessageInput component)
    sendMessage: async (messageData) => {
        // Get current state values using get()
        const { selectedUser, messages } = get();
        
        try {
            // Send message to backend with text and/or image
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            
            // Optimistically update UI by adding new message to state
            // Spread existing messages and add the new one from response
            set({ messages: [...messages, res.data] });
        } catch (error) {
            // Show error notification to user
            toast.error(error.response.data.message);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser }= get();
        if(!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        //todo: optimize this one later
        socket.on("newMessage", (newMessage) => {
            set({
                messages: [...get().messages, newMessage],
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    // ACTION: Set the currently selected user for chat (called when clicking user in Sidebar)
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

