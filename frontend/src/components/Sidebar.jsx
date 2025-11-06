import { useEffect } from "react"; // React hook for side effects
import { useChatStore } from "../store/useChatStore"; // Import chat state and actions
import { useAuthStore } from "../store/useAuthstore"; // Import auth state (for online users)
import SidebarSkeleton from "./skeletons/SidebarSkeleton"; // Loading skeleton component
import { Users } from "lucide-react"; // Icon component

const Sidebar = () => {
    // HOOK: Get chat state and actions from store
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    
    // HOOK: Get online users array from auth store
    const { onlineUsers } = useAuthStore();

    // EFFECT: Fetch all users when component mounts
    useEffect(() => {
        getUsers(); // Call action to fetch users from backend
    }, [getUsers]); // Dependency array - only run once when component mounts

    // CONDITIONAL RENDER: Show skeleton while loading users
    if (isUsersLoading) return <SidebarSkeleton />

    return (
       <aside className="h-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
         {/* Sidebar header */}
         <div className="border-b border-base-300 w-full p-5">
            <div className="flex items-center gap-2">
                <Users className="size-6"/>
                <span className="font-medium hidden lg:block">Contacts</span>
            </div>
            {/* TODO: online filter toggle */}
        </div>
        
        {/* Users list - scrollable */}
        <div className="overflow-y-auto w-full py-3">
            {/* Loop through users array and render each user */}
            {users.map((user) => (
                <button
                    key={user._id} // Unique key for React list rendering
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
                    </div>

                    {/* User info - only visible on larger screens */}
                    <div className="hidden lg:block text-left min-w-0">
                        <div className="font-medium truncate">{user.fullName}</div>
                        <div className="text-sm text-zinc-400">
                            {/* Show "Online" or "Offline" based on onlineUsers array */}
                            {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                        </div>
                    </div>
                </button>
            ))}
        </div>
       </aside>
    );
};

export default Sidebar;
                        