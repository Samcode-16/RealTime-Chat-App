# RealTime Chat App

Fast, real‑time 1:1 chat with presence, unread badges, delivery/read ticks, image/file sharing, and profile edits. Built with React + Vite, Zustand, Tailwind/DaisyUI, Node/Express, MongoDB (Mongoose), Socket.IO, and Cloudinary.

## **Features**
1. Real‑time private messaging — Socket.IO (targeted emits)
2. Conversation history — Express + Mongoose (`hiddenFor` filter)
3. Online presence — Socket.IO online map + client subscription
4. Recent chat to top — Zustand reorder helper
5. Unread badges — REST (`GET /messages/unread-counts/all`) + socket `unreadUpdated`
6. Delivery/read receipts — Mongoose fields (`delivered`, `read`) + socket acks
7. Delete for me/everyone — Express routes + socket events
8. Image attachments — Cloudinary image upload
9. File attachments (PDF, etc.) — Cloudinary raw upload
10. Reliable downloads — Backend proxy `GET /api/messages/file/download/:id`
11. Profile edits (name, bio, avatar) — Auth endpoints + Cloudinary

## **Tech Stack**
- Frontend: React 18, Vite, Zustand, React Router, Axios, Tailwind CSS, DaisyUI, lucide‑react
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Cloudinary

## **Setup**
Create `backend/.env`:
```
PORT=5001
MONGODB_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

## **Run (dev)**
```powershell
# Backend
cd D:\BCA\3rdSem\WT\RealTime-Chat-App\backend; npm install; npm run dev

# Frontend
cd D:\BCA\3rdSem\WT\RealTime-Chat-App\frontend; npm install; npm run dev
```

## **Screenshots**
Add PNGs to `./screenshots/`.

| View | Image |
|------|-------|
| Chat Window | ![Chat Window](./screenshots/chat-window.png) |
| Sidebar | ![Sidebar](./screenshots/chat-list.png) |
| Profile | ![Profile](./screenshots/profile.png) |

## **Authors**
Samudyatha K Bhat • Subavarsha