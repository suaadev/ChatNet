# ChatNet - Real-Time Multi-Room WebSocket Chat

A full-stack, real-time multi-room messaging platform built with **Node.js**, **Express**, **Socket.IO**, and **React**.

---

## Overview

**ChatNet** enables instant, bidirectional communication across dynamic topic channels. Users select a username, receive a signed JWT session token, create or join live rooms, and exchange real-time messages with automated presence detection and room lifecycle management.

> [!NOTE]
> **Educational & Demonstration Scope**: This project is developed primarily for educational, research, and portfolio demonstration purposes. While it follows clean WebSocket architecture, state management, and tokenized socket verification, it is designed for learning, prototypes, and demonstration workloads.

---

## Features

- **Real-Time Bidirectional Messaging**: Low-latency communication powered by **Socket.IO** and WebSockets with automatic fallback.
- **Dynamic Multi-Room Architecture**:
  - Default channels (`#general`, `#tech`, `#random`).
  - On-the-fly room creation by any active user with instant broadcast to all connected clients.
  - Automatic garbage collection and deletion of empty custom rooms when all participants leave.
- **Tokenized Session Security**:
  - Stateless JSON Web Token (JWT) issued upon username selection.
  - Socket payload verification for room joining and message broadcasting.
- **Live User Presence & State**:
  - Broadcast notifications when users join, leave, or disconnect from a room.
  - Unique persistent hex color assignment per user session for visual message distinction.
- **Monorepo Architecture**:
  - Clean separation between `server/` (Node.js/Socket.IO backend) and `client/` (React SPA).

---

## Tech Stack

- **Backend (`server/`)**:
  - Runtime: [Node.js](https://nodejs.org/) (v20+ recommended)
  - Framework: [Express.js](https://expressjs.com/)
  - Real-Time Engine: [Socket.IO](https://socket.io/)
  - Security: [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [uuid](https://www.npmjs.com/package/uuid)
- **Frontend (`client/`)**:
  - Framework: [React 18](https://react.dev/)
  - Client Socket: [socket.io-client](https://www.npmjs.com/package/socket.io-client)
  - Routing: [React Router v6](https://reactrouter.com/)
  - Styling: Vanilla CSS Modules
- **DevOps**:
  - [Docker](https://www.docker.com/) & [Nginx](https://www.nginx.com/)

---

## WebSocket Event Protocol

| Event (Client &rarr; Server) | Payload | Description |
| :--- | :--- | :--- |
| `new_user` | `{ username }` | Registers user session and returns signed JWT token. |
| `get-rooms` | *none* | Requests list of all currently active rooms. |
| `join-room` | `{ name_room, username, colorUser, tkn }` | Joins a room, announces presence, or creates room if new. |
| `leave-room` | `{ name_room, colorUser, username }` | Leaves a room, notifies participants, and cleans up empty rooms. |
| `send-message-to-room` | `{ toRoom, text, username, colorUser, tkn }` | Broadcasts message to all clients in the target room. |

| Event (Server &rarr; Client) | Payload | Description |
| :--- | :--- | :--- |
| `info_message` | `{ status, message, tkn? }` | Authentication response or status/error feedback. |
| `get-rooms` | `{ rooms: [] }` | Returns active room names array. |
| `new_room` | `{ new_room }` | Broadcasts creation of a new channel to all clients. |
| `delete_room` | `{ name_room }` | Broadcasts deletion of an empty custom channel. |
| `user_entered_room` | `{ username, colorUser, type }` | Broadcasts user entry into the room. |
| `user_leave_room` | `{ username, colorUser, type }` | Broadcasts user departure or disconnection. |
| `received_message` | `{ text, colorUser, username }` | Delivers new chat message to room participants. |

---

## Project Structure

```text
ChatNet/
├── README.md               # Project documentation
├── LICENSE                 # MIT License
├── .gitignore              # Monorepo git ignore rules
├── server/                 # Backend WebSocket & Express service
│   ├── index.js            # Server entrypoint
│   ├── package.json        # Backend dependencies & scripts
│   ├── Dockerfile          # Server Docker container
│   ├── .env.example        # Backend environment template
│   └── src/
│       ├── app.js          # Express app & HTTP server config
│       └── sockets/
│           └── mainSocket.js # Socket.IO event controllers & room lifecycle
└── client/                 # Frontend React Application
    ├── package.json        # Frontend dependencies & scripts
    ├── Dockerfile          # Frontend production container
    ├── .env.example        # Frontend environment template
    ├── public/             # Static HTML template & assets
    └── src/
        ├── index.js        # React DOM mount
        ├── App.js          # Main router
        ├── socket.js       # Socket.IO client instance
        ├── pages/          # Home view
        ├── components/     # TypeNameUser, SeeUser, ChatView
        ├── helpers/        # Hex color generator
        └── styles/         # Component stylesheets
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### 1. Installation

Install dependencies across the monorepo (root, server, and client) with a single command:

```bash
git clone https://github.com/suaadev/ChatNet.git
cd ChatNet
npm run install:all
```

### 2. Configure Environment Variables

Create environment files for both server and client:

```bash
# Server configuration (PORT=5000, KEY_SECRET=...)
cp server/.env.example server/.env

# Client configuration (REACT_APP_SOCKET_URL=http://localhost:5000)
cp client/.env.example client/.env
```

### 3. Running Both Projects Concurrently

Run both the **WebSocket Server** (`:5000`) and the **React Client** (`:3000`) simultaneously with live reloading:

```bash
npm run dev
```

Alternatively, to start both in production mode:

```bash
npm start
```

To run individual services:
- **Server only**: `npm run dev:server`
- **Client only**: `npm run dev:client`

---

## Docker Deployment

Build and run both services using Docker:

```bash
# Build and run server
docker build -t chatnet-server ./server
docker run -d -p 5000:5000 --name chatnet-api chatnet-server

# Build and run client
docker build -t chatnet-client ./client
docker run -d -p 3000:80 --name chatnet-web chatnet-client
```

---

## License

This project is licensed under the [MIT License](LICENSE).