import { useChatStore } from "../store/useChatStore"; 
import { useEffect, useRef } from "react"; 

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthstore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  // HOOK: Get chat state and actions from Zustand store
  const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages,
    unsubscribeFromMessages } = useChatStore();
  
  // HOOK: Get authenticated user info from auth store
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // EFFECT: Fetch messages when a user is selected
  // This runs whenever selectedUser changes
  useEffect(() => {
    // Only fetch messages if a user is selected
    if (selectedUser?._id) {
      // Call getMessages action to fetch conversation history
      getMessages(selectedUser._id);

      // Subscribe to real-time messages for this conversation
      subscribeToMessages();

      // Cleanup: Unsubscribe when component unmounts or user changes
      return () => unsubscribeFromMessages();
    }
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]); // Dependencies: re-run when these change

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth"});
    }
  }, [messages])


  // CONDITIONAL RENDER: Show loading state while fetching messages
  if (isMessagesLoading)
    return <div>Loading...</div>
  
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Header showing selected user's info */}
      <ChatHeader />
      
      {/* Messages container - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loop through messages array and render each message */}
        {messages.map((message) => (
          <div
            key={message._id} // Unique key for React list rendering
            // Conditional class: align message right if sent by me, left if received
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
          > 
            {/* Profile picture of message sender */}
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img 
                  src={
                    // Show my profile pic if I sent it, otherwise show other user's pic
                    message.senderId === authUser._id 
                      ? authUser.profilePic || "/avatar.png" 
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic" 
                />
              </div>
            </div>
            
            {/* Timestamp showing when message was sent */}
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            
            {/* Message bubble containing text and/or image */}
            <div className="chat-bubble flex flex-col">
              {/* Show image if message has one */}
              {message.image && (
                <img 
                  src={message.image} 
                  alt="attachment" 
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {/* Show text if message has text */}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Input component for sending new messages */}
      <MessageInput />
    </div>
  )
};

export default ChatContainer;