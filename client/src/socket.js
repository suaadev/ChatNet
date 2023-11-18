import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname
    ? `http://${window.location.hostname}:5000`
    : "http://localhost:5000");

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
