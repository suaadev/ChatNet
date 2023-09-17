import "dotenv/config";
import express from "express";
import { createServer } from "http";
import mainSocket from "./sockets/mainSocket.js";

const server_express = express();

server_express.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

server_express.disable("x-powered-by");
server_express.use(express.json());

server_express.get("/", (req, res) => {
  res.json({ status: "ok", service: "ChatNet WebSocket Server" });
});

const app_server = createServer(server_express);
mainSocket(app_server);

export default app_server;
