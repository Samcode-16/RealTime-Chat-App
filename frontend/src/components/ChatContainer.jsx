import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useAuthStore } from "../store/useAuthstore";
import { useChatStore } from "../store/useChatStore";

const ChatContainer = () => {
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-base-100 border-b border-base-300 px-6 py-4">
        <div className="flex items-center gap-3">
          <img 
            src={selectedUser?.profilePic || "/avatar.png"}
            alt={selectedUser?.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-medium">{selectedUser?.fullName}</h2>
            <p className="text-sm text-base-content/70">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* This will be replaced with actual messages */}
        <div className="space-y-6">
          <div className="flex gap-3">
            <img
              src={selectedUser?.profilePic || "/avatar.png"}
              alt={selectedUser?.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="bg-base-300 rounded-2xl p-3 max-w-[80%]">
              <p>Hey! How are you?</p>
              <span className="text-[10px] text-base-content/70">12:30 PM</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <div className="bg-primary text-primary-content rounded-2xl p-3 max-w-[80%]">
              <p>I'm good, thanks! How about you?</p>
              <span className="text-[10px] text-primary-content/70">12:31 PM</span>
            </div>
            <img
              src={authUser?.profilePic || "/avatar.png"}
              alt={authUser?.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-base-100 border-t border-base-300 px-6 py-4">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm btn-circle">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-base-200 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none placeholder:text-base-content/50"
            />
            <button className="btn btn-ghost btn-sm btn-circle">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button className="btn btn-primary btn-sm btn-circle">
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
