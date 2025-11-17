// Utility to format a date/time for chat message timestamps
export function formatMessageTime(date) {
    if (!date) return "";
    try {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } catch (e) {
        return "";
    }
}

// Convert a Cloudinary URL to inline-open link by injecting fl_inline
// Works for Cloudinary URLs of the form https://res.cloudinary.com/<cloud>/<type>/upload/.../file
export function cloudinaryAttachmentUrl(url, filename) {
    try {
        if (!url || typeof url !== "string") return url;
        const isCloudinary = url.includes("res.cloudinary.com") && url.includes("/upload/");
        if (!isCloudinary) return url;
        const safeName = (filename || "attachment").replace(/[^a-zA-Z0-9._-]+/g, "_");
        // fl_attachment triggers download with optional filename
        return url.replace("/upload/", `/upload/fl_attachment:${safeName}/`);
    } catch {
        return url;
    }
}