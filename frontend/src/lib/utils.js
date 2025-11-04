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