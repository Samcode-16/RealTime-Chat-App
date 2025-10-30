import express from 'express';
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controllers.js";

const router = express.Router()

// Placeholder routes for messages
router.get('/', (req, res) => {
  res.json({ message: 'Message route placeholder' })
})


//endpoint to see users in the sidebar
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage)

export default router;