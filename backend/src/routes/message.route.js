import express from 'express';
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, deleteMessage, getUnreadCounts, downloadAttachment } from "../controllers/message.controllers.js";

const router = express.Router()

// Placeholder routes for messages
router.get('/', (req, res) => {
  res.json({ message: 'Message route placeholder' })
})


//endpoint to see users in the sidebar
router.get("/users", protectRoute, getUsersForSidebar);
// download should be before dynamic :id patterns
router.get("/file/download/:id", protectRoute, downloadAttachment);
router.get("/unread-counts/all", protectRoute, getUnreadCounts);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage)

// delete message - query ?for=me | ?for=all
router.delete("/:id", protectRoute, deleteMessage)

export default router;