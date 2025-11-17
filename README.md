# RealTime Chat App

A modern, full‑stack, real‑time messaging application with private chats, online presence, delivery/read receipts, image sharing, and a polished UI. Built with React + Vite, Zustand, Tailwind/DaisyUI on the frontend, and Node.js + Express, MongoDB (Mongoose), and Socket.IO on the backend. Images are handled via Cloudinary.

## Features
- Real‑time messaging with Socket.IO (no page refresh)
- Private 1:1 chats with image attachments
- Online status indicator and “show online only” filter
- Unread message badges and automatic chat reordering (most recent to top)
- Delivery/read receipts with WhatsApp‑style ticks
	- Single gray tick: sent
	- Double gray ticks: delivered
	- Double blue ticks: read
- Message deletion options
	- Delete for me (local hide)
	- Delete for everyone (both sides see “This message was deleted”)
- Auth (signup, login, JWT cookies), protected APIs
- Profile management
	- Upload/change avatar (Cloudinary)
	- Edit full name and profile bio (visible to others in chat header)
- Responsive, accessible UI with Tailwind CSS and DaisyUI

## Tech Stack
- Frontend: React 18, Vite, Zustand, React Router, Axios, react‑hot‑toast, Tailwind CSS, DaisyUI, lucide‑react
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Cloudinary

## Monorepo Structure
```
RealTime-Chat-App/
	backend/
		src/
			controllers/
			lib/
			middleware/
			models/
			routes/
	frontend/
		src/
			components/
			pages/
			store/
			lib/
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB connection string (Cloud or local)
- Cloudinary account (for profile pictures and image messages)

### Environment Variables

Create a `backend/.env` with:
```
PORT=5001               # match frontend dev defaults
MONGODB_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

Notes:
- The frontend dev environment targets `http://localhost:5001` for REST and socket by default. Either set `PORT=5001` (recommended) or change the socket/API base in `frontend/src/store/useAuthstore.js` and `frontend/src/lib/axios.js` to match your backend port.

### Install & Run (dev)

Run backend and frontend in separate terminals.

```powershell
# Terminal 1: backend
cd D:\BCA\3rdSem\WT\RealTime-Chat-App\backend
npm install
npm run dev

# Terminal 2: frontend
cd D:\BCA\3rdSem\WT\RealTime-Chat-App\frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build (frontend)
```powershell
cd D:\BCA\3rdSem\WT\RealTime-Chat-App\frontend
npm run build
npm run preview
```

## Backend Overview

### Key Files
- `src/index.js` — Express app, CORS, routes, Socket.IO init
- `src/lib/db.js` — MongoDB connection
- `src/lib/socket.js` — Socket.IO server, online map, delivery/read acks
- `src/models/user.model.js` — User schema (email, fullName, password, profilePic, bio)
- `src/models/message.model.js` — Message schema (senderId, receiverId, text, image, delivered, read, deletedForEveryone, hiddenFor)
- `src/controllers/auth.controller.js` — Auth (signup/login/logout/check), update avatar, update name/bio
- `src/controllers/message.controllers.js` — Get users, get messages, send, delete
- `src/routes/*.route.js` — API routing

### REST API
Base path: `/api`

Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET  /auth/check` — returns current user
- `PATCH /auth/update` — multipart avatar upload (Cloudinary)
- `PATCH /auth/update-info` — `{ fullName?, bio? }`

Messages
- `GET    /messages/users` — users for sidebar (except self)
- `GET    /messages/:id` — conversation with given user id (hides messages you deleted “for me”)
- `POST   /messages/send/:id` — send text/image message
- `DELETE /messages/:id?for=me` — hide only for me
- `DELETE /messages/:id?for=all` — delete for everyone (sender only)

### Socket Events
Server → Client
- `getOnlineUsers` — `string[]` of online user IDs
- `newMessage` — new message object for the receiver
- `messageDelivered` — `{ messageId }` ack for sender
- `messageRead` — `{ messageId }` ack for sender
- `messageDeletedForEveryone` — `{ messageId }` for both users

Client → Server
- via handshake query: `userId` (for online tracking)
- `messageDelivered` — message reached receiver
- `messageRead` — message read by receiver

## Frontend Overview

### State Management (Zustand)
- `useAuthstore` — authUser, socket init/cleanup, online users, auth actions, avatar upload, update name/bio
- `useChatStore` — users, messages, selected user, unread counts, fetch users/messages, send, delete for me/everyone, message subscriptions, reordering, delivery/read updates

### UI Highlights
- `Sidebar` — users list with online dot, unread badge, “online only” filter, recent chats float to top
- `ChatContainer` — conversation view, image messages, ticks for sent/delivered/read, per‑message dropdown to delete (me/everyone)
- `ChatHeader` — selected user info with online status and bio shown to the other user
- `MessageInput` — text + image upload with preview
- `ProfilePage` — edit name, bio; upload avatar

## Development Notes
- Align backend `PORT` with frontend dev config (default 5001) to avoid socket/API mismatches.
- When adding features that affect message shape (e.g., reactions), update both the Mongoose schema and the frontend message rendering.
- For unread counts across devices, add server‑side unread tracking; currently the client maintains unread per session.

## Screenshots
Add PNGs to `./screenshots/` and they will render below.

| View | Image |
|------|-------|
| Register | ![Register](./screenshots/register.png) |
| Login | ![Login](./screenshots/login.png) |
| Profile | ![Profile](./screenshots/profile.png) |
| Chat Window | ![Chat Window](./screenshots/chat-window.png) |
| Chat List | ![Chat List](./screenshots/chat-list.png) |
| Settings | ![Settings](./screenshots/settings.png) |


## Authors
Samudyatha K Bhat
Subavarsha