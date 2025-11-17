import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
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
    unreadCounts: {},                // Map of userId -> unread count

    // internal: recents persistence in localStorage
    _recentsKey: "chat_recent_timestamps",
    _loadRecents: () => {
        try {
            const raw = localStorage.getItem(get()._recentsKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    },
    _saveRecents: (map) => {
        try {
            localStorage.setItem(get()._recentsKey, JSON.stringify(map || {}));
        } catch {
            // ignore quota/serialization issues
        }
    },
    updateRecent: (userId) => {
        if (!userId) return;
        const map = { ...get()._loadRecents(), [userId]: Date.now() };
        get()._saveRecents(map);
    },

    // ACTION: Fetch all users available for chat (called in Sidebar)
    getUsers: async () => {
        set({ isUsersLoading: true }); // Show loading state
        try {
            // Request list of users from backend
            const res = await axiosInstance.get("/messages/users");
            const list = Array.isArray(res.data) ? res.data : [];
            const recents = get()._loadRecents();
            const sorted = [...list].sort((a, b) => (recents[b._id] || 0) - (recents[a._id] || 0));
            // Update state with fetched users (sorted by recent activity)
            set({ users: sorted });
        } catch (error) {
            // Show error notification to user
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false }); // Hide loading state
        }
    },

    // ACTION: Fetch server-side unread counts grouped by sender
    fetchUnreadCounts: async () => {
        try {
            const res = await axiosInstance.get("/messages/unread-counts/all");
            if (res?.data && typeof res.data === "object") {
                set({ unreadCounts: res.data });
            }
        } catch (error) {
            // best-effort; keep client-side fallbacks
            console.warn("Unread counts fetch failed:", error?.response?.data || error?.message);
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

            // Move the receiver to the top of the users list
            get().moveUserToTop(selectedUser._id);

            // Persist recency so the last chatted user stays on top after reload
            get().updateRecent(selectedUser._id);

            // Do NOT increment unread for outgoing messages
        } catch (error) {
            // Show error notification to user
            toast.error(error.response.data.message);
        }
    },

    // ACTION: Delete a message only for me (hide locally)
    deleteMessageForMe: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/${messageId}?for=me`);
            set({ messages: get().messages.filter((m) => m._id !== messageId) });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete");
        }
    },

    // ACTION: Delete a message for everyone (sender only)
    deleteMessageForEveryone: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/${messageId}?for=all`);
            // optimistic update
            set({
                messages: get().messages.map((m) =>
                    m._id === messageId ? { ...m, deletedForEveryone: true, text: "", image: undefined, fileUrl: undefined, fileName: undefined, fileType: undefined } : m
                ),
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete for everyone");
        }
    },

    // HELPER: Move a user to the top of the users list without in-place mutation
    moveUserToTop: (userId) => {
        const users = get().users || [];
        const index = users.findIndex(u => u._id === userId);
        if (index === -1) return; // user not in list, nothing to reorder

        const reordered = [users[index], ...users.filter((_, i) => i !== index)];
        set({ users: reordered });
    },

    // HELPER: Increment unread count for a user
    incrementUnread: (userId) => {
        if (!userId) return;
        const current = get().unreadCounts || {};
        const next = { ...current, [userId]: (current[userId] || 0) + 1 };
        set({ unreadCounts: next });
    },

    // HELPER: Clear unread count for a user
    clearUnread: (userId) => {
        if (!userId) return;
        const current = get().unreadCounts || {};
        if (!current[userId]) return;
        const { [userId]: _, ...rest } = current;
        set({ unreadCounts: rest });
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            const currentSelected = get().selectedUser;
            const currentMessages = get().messages;

            // Reorder sender to top in contacts
            if (newMessage?.senderId) {
                get().moveUserToTop(newMessage.senderId);
                // Persist recency for future sessions
                get().updateRecent(newMessage.senderId);
            }

            // If message belongs to currently open conversation, append it
            if (currentSelected && newMessage.senderId === currentSelected._id) {
                set({ messages: [...currentMessages, newMessage] });
                // Emit read immediately for messages in the active chat
                socket.emit("messageRead", newMessage._id);
                // No unread bump for the active conversation
                return;
            }

            // Otherwise, bump unread count for the sender
            if (newMessage?.senderId) {
                get().incrementUnread(newMessage.senderId);
            }

            // Always acknowledge delivery to the server
            socket.emit("messageDelivered", newMessage._id);
        });

        // Update local message status when the server confirms delivery
        socket.on("messageDelivered", ({ messageId }) => {
            const list = get().messages;
            if (!Array.isArray(list) || !messageId) return;
            const updated = list.map(m => m._id === messageId ? { ...m, delivered: true } : m);
            set({ messages: updated });
        });

        // Update local message status when the server confirms read
        socket.on("messageRead", ({ messageId }) => {
            const list = get().messages;
            if (!Array.isArray(list) || !messageId) return;
            const updated = list.map(m => m._id === messageId ? { ...m, delivered: true, read: true } : m);
            set({ messages: updated });
        });

        // Other-side deleted for everyone
        socket.on("messageDeletedForEveryone", ({ messageId }) => {
            if (!messageId) return;
            set({
                messages: get().messages.map((m) =>
                    m._id === messageId ? { ...m, deletedForEveryone: true, text: "", image: undefined, fileUrl: undefined, fileName: undefined, fileType: undefined } : m
                ),
            });
        });

        // Server-side unread count updates for a specific sender
        socket.on("unreadUpdated", ({ from, count }) => {
            if (!from) return;
            const current = get().unreadCounts || {};
            set({ unreadCounts: { ...current, [from]: count } });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("newMessage");
        socket.off("messageDelivered");
        socket.off("messageRead");
        socket.off("messageDeletedForEveryone");
        socket.off("unreadUpdated");
    },

    // ACTION: Set the currently selected user for chat (called when clicking user in Sidebar)
    setSelectedUser: (selectedUser) => {
        set({ selectedUser });
        if (selectedUser?._id) {
            // Clear unread when user opens the conversation
            get().clearUnread(selectedUser._id);
        }
    },
}));

