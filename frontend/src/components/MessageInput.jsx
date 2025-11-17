import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, X, Send, Paperclip } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  // STATE: Track message text input
  const [text, setText] = useState("");
  
  // STATE: Track image preview (base64 string)
  const [imagePreview, setImagePreview] = useState(null);
  // STATE: Track generic file attachment (non-image)
  const [fileInfo, setFileInfo] = useState(null); // { name, type, size }
  const [fileBase64, setFileBase64] = useState(null);
  
  // REF: Reference to hidden file input element
  const fileInputRef = useRef(null);
  const anyFileInputRef = useRef(null);
  
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

  // HANDLER: Called when user selects a generic file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prevent using this path for images; ask user to use the image button
    if (file.type.startsWith("image/")) {
      toast.error("Use the photo icon to attach images");
      return;
    }

    // Size guard: max ~10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result);
      setFileInfo({ name: file.name, type: file.type || "application/octet-stream", size: file.size });
    };
    reader.readAsDataURL(file);
  };

  // HANDLER: Remove selected image
  const removeImage = () => {
    setImagePreview(null); // Clear preview state
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
  };

  const removeFile = () => {
    setFileInfo(null);
    setFileBase64(null);
    if (anyFileInputRef.current) anyFileInputRef.current.value = "";
  };

  // HANDLER: Send message when form is submitted
  const handleSendMessage = async(e) => {
    e.preventDefault(); // Prevent page reload on form submit
    
    // Don't send if both text and image are empty
    if (!text.trim() && !imagePreview && !fileBase64) return;

    try {
      // Call sendMessage action with text and/or image
      await sendMessage({ 
        text: text.trim(), // Remove whitespace from text
        image: imagePreview, // Base64 image string (null if no image)
        file: fileBase64,
        fileName: fileInfo?.name,
        fileType: fileInfo?.type,
      });

      // Clear form after successful send
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      removeFile();
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
          {/* Hidden any-file input */}
          <input
            type="file"
            className="hidden"
            ref={anyFileInputRef}
            onChange={handleFileChange}
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
          {/* File attach button */}
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${fileInfo ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => anyFileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
        </div>
        
        {/* Send button - disabled if no text and no image */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !fileBase64}
        >
          <Send size={22} />
        </button>
      </form>

      {/* File preview chip */}
      {fileInfo && (
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-base-200 text-sm">
          <Paperclip className="w-4 h-4" />
          <span className="truncate max-w-[240px]" title={fileInfo.name}>{fileInfo.name}</span>
          <button type="button" onClick={removeFile} className="btn btn-ghost btn-xs">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
