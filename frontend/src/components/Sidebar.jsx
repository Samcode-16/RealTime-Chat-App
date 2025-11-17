import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthstore"; 
import SidebarSkeleton from "./skeletons/SidebarSkeleton"; 
import { Users } from "lucide-react";

const Sidebar = () => {
    // HOOK: Get chat state and actions from store
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts, fetchUnreadCounts } = useChatStore();

    // HOOK: Get online users array from auth store
    const { onlineUsers } = useAuthStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    // EFFECT: Fetch all users when component mounts
    useEffect(() => {
        getUsers();                             // Call action to fetch users from backend
        fetchUnreadCounts(); // sync server-side unread counts at load
    }, [getUsers]);                             // Dependency array - only run once when component mounts

    // Base filtered list
    const baseFiltered = showOnlineOnly ? users.filter(user => onlineUsers.includes(user._id)) : users;
    // Ensure the currently selected user stays visible at the top even if "online only" is enabled
    // This prevents confusion when chatting with someone who is offline
    const filteredUsers = (showOnlineOnly && selectedUser && !onlineUsers.includes(selectedUser._id))
        ? [selectedUser, ...baseFiltered.filter(u => u._id !== selectedUser._id)]
        : baseFiltered;

    // CONDITIONAL RENDER: Show skeleton while loading users
    if (isUsersLoading) return <SidebarSkeleton />;

    return (
       <aside className="h-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
         {/* Sidebar header */}
         <div className="border-b border-base-300 w-full p-5">
            <div className="flex items-center gap-2">
                <Users className="size-6"/>
                <span className="font-medium hidden lg:block">Contacts</span>
            </div>
            {/* TODO: online filter toggle */}
            <div className="mt-3 hidden lg:flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={showOnlineOnly}
                        onChange={(e) => setShowOnlineOnly(e.target.checked)}
                        className="checkbox checkbox-sm"
                    />
                    <span className="text-sm">Show online only</span>
                </label>
                <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
            </div>
        </div>
        
        {/* Users list - scrollable */}
        <div className="overflow-y-auto w-full py-3">
            {/* Loop through users array and render each user */}
            {filteredUsers.map((user) => (
                <button
                    key={user._id}                         // Unique key for React list rendering
                    onClick={() => setSelectedUser(user)} // Set this user as selected when clicked
                    className={`
                        w-full p-3 flex items-center gap-3
                        hover:bg-base-300 transition-colors
                        ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                    `}
                >
                    {/* User avatar with online status indicator */}
                    <div className="relative mx-auto lg:mx-0">
                        <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.name}
                            className="size-12 object-cover rounded-full"
                        />
                        {/* Green dot indicator - only shown if user is online */}
                        {onlineUsers.includes(user._id) && (
                            <span 
                                className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900"
                            />
                        )}
                        {/* Unread badge on avatar */}
                        {!!unreadCounts?.[user._id] && (
                          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-content text-[10px] flex items-center justify-center">
                            {unreadCounts[user._id]}
                          </span>
                        )}
                    </div>

                    {/* User info - only visible on larger screens */}
                    <div className="hidden lg:block text-left min-w-0">
                        <div className={`font-medium truncate ${unreadCounts?.[user._id] ? "font-semibold" : ""}`}>
                          {user.fullName}
                        </div>
                        <div className="text-sm text-zinc-400">
                            {/* Show "Online" or "Offline" based on onlineUsers array */}
                            {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                        </div>
                    </div>
                </button>
            ))}

            {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
        </div>
       </aside>
    );
};

export default Sidebar;
                        