import { useRef, useState } from "react"; // React hooks for refs and state
import { useChatStore } from "../store/useChatStore"; // Import chat actions
import { Image, X, Send } from "lucide-react"; // Icon components

const MessageInput = () => {
  // STATE: Track message text input
  const [text, setText] = useState("");
  
  // STATE: Track image preview (base64 string)
  const [imagePreview, setImagePreview] = useState(null);
  
  // REF: Reference to hidden file input element
  const fileInputRef = useRef(null);
  
  // HOOK: Get sendMessage action from chat store
  const { sendMessage } = useChatStore();

  // HANDLER: Called when user selects an image file
  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Get first selected file
    
    // Validate that selected file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Convert image file to base64 string for preview and upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result); // Set preview when reading completes
    }
    reader.readAsDataURL(file); // Start reading file
  };

  // HANDLER: Remove selected image
  const removeImage = () => {
    setImagePreview(null); // Clear preview state
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
  };

  // HANDLER: Send message when form is submitted
  const handleSendMessage = async(e) => {
    e.preventDefault(); // Prevent page reload on form submit
    
    // Don't send if both text and image are empty
    if (!text.trim() && !imagePreview) return;

    try {
      // Call sendMessage action with text and/or image
      await sendMessage({ 
        text: text.trim(), // Remove whitespace from text
        image: imagePreview, // Base64 image string (null if no image)
      });

      // Clear form after successful send
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      // Error is handled in store with toast notification
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Image preview section - only shown when image is selected */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {/* Preview of selected image */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border-zinc-700"
            />
            {/* Remove image button */}
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          {/* Text input field */}
          <input 
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text} // Controlled input - value from state
            onChange={(e) => setText(e.target.value)} // Update state on change
          />
          
          {/* Hidden file input - triggered by button click */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef} // Reference to access this element
            onChange={handleImageChange}
          />
          
          {/* Button to trigger file selection */}
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                        ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()} // Programmatically click file input
          >
            <Image size={20} />
          </button>
        </div>
        
        {/* Send button - disabled if no text and no image */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
