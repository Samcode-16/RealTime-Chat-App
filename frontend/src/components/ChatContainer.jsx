import { useChatStore } from "../store/useChatStore"; 
import { useEffect, useRef, useMemo } from "react"; 

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthstore";
import { formatMessageTime, cloudinaryAttachmentUrl } from "../lib/utils";
import { Check, CheckCheck, MoreVertical, Paperclip } from "lucide-react";

const ChatContainer = () => {
  // HOOK: Get chat state and actions from Zustand store
  const { 
    messages, 
    getMessages,
    isMessagesLoading, 
    selectedUser, 
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessageForMe,
    deleteMessageForEveryone,
  } = useChatStore();
  
  // HOOK: Get authenticated user info from auth store
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // EFFECT: Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
  }, [selectedUser?._id, getMessages]);

  // Subscription handled globally in App.jsx to avoid duplicate handlers

  // EFFECT: Auto-scroll to latest message
  useEffect(() => {
    if (messageEndRef.current && (messages?.length ?? 0) > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // EFFECT: Mark messages as read when opening/viewing a conversation
  useEffect(() => {
    if (!socket || !selectedUser?._id || !Array.isArray(messages)) return;
    // Find unread incoming messages from this user and mark them read
    const unread = messages.filter(
      (m) => m.senderId === selectedUser._id && !m.read
    );
    if (unread.length) {
      unread.forEach((m) => socket.emit("messageRead", m._id));
    }
  }, [socket, selectedUser?._id, messages]);

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
        {(messages || []).map((message) => (
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
            <div className="chat-bubble flex flex-col relative group">
              {/* Dropdown for delete actions */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <details className="dropdown dropdown-end">
                  <summary className="btn btn-ghost btn-xs"><MoreVertical className="w-4 h-4" /></summary>
                  <ul className="dropdown-content menu menu-sm bg-base-100 rounded-box shadow z-[1] w-48">
                    <li>
                      <button onClick={() => deleteMessageForMe(message._id)}>Delete for me</button>
                    </li>
                    {message.senderId === authUser._id && (
                      <li>
                        <button className="text-error" onClick={() => deleteMessageForEveryone(message._id)}>Delete for everyone</button>
                      </li>
                    )}
                  </ul>
                </details>
              </div>
              {/* Show image if message has one */}
              {!message.deletedForEveryone && message.image && (
                <img 
                  src={message.image} 
                  alt="attachment" 
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {/* Show file attachment link if present (non-image) */}
              {!message.deletedForEveryone && message.fileUrl && (
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 underline"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="truncate max-w-[200px]" title={message.fileName || "Attachment"}>
                      {message.fileName || "Attachment"}
                    </span>
                  </a>
                  <a
                    href={`/api/messages/file/download/${message._id}`}
                    className="link"
                  >
                    Download
                  </a>
                </div>
              )}
              {/* Show text if message has text */}
              {message.deletedForEveryone ? (
                <p className="italic opacity-70">This message was deleted</p>
              ) : (
                message.text && <p>{message.text}</p>
              )}
              {/* Status ticks for messages sent by me */}
              {message.senderId === authUser._id && (
                <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                  {!message.delivered && !message.read && (
                    <Check className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  {message.delivered && !message.read && (
                    <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  {message.read && (
                    <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                  )}
                </div>
              )}
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