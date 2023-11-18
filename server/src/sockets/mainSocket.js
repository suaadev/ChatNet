import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export default (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const defaultRooms = ["general", "dev", "random"];
  const rooms = {
    general: [],
    dev: [],
    random: [],
  };

  const users_connect = {};
  const clients_connect = {};

  io.on("connection", (client) => {
    console.log(`[Socket] Client connected: ${client.id}`);

    client.on("new_user", (body) => {
      const { username } = body || {};
      if (!username || username.trim() === "") {
        return client.emit("info_message", {
          status: 400,
          message: "Username is required",
        });
      }

      const trimmedName = username.trim();
      if (users_connect[trimmedName]) {
        return client.emit("info_message", {
          status: 400,
          message: "Username is already in use",
        });
      }

      const sessionId = uuidv4();
      users_connect[trimmedName] = {
        userId: client.id,
        currentRoom: "",
        sessionId,
      };
      clients_connect[client.id] = trimmedName;

      const secret = process.env.KEY_SECRET || "chatnet_jwt_secret_key_2024";
      const tkn = jwt.sign({ sessionId, username: trimmedName }, secret);

      return client.emit("info_message", {
        status: 200,
        message: "OK",
        tkn,
      });
    });

    client.on("get-rooms", () => {
      client.emit("get-rooms", { rooms: Object.keys(rooms) });
    });

    client.on("join-room", (body) => {
      try {
        const { name_room, username, colorUser, tkn } = body || {};
        if (!tkn) {
          return client.emit("info_message", {
            status: 401,
            message: "Authentication token required",
          });
        }

        const secret = process.env.KEY_SECRET || "chatnet_jwt_secret_key_2024";
        jwt.verify(tkn, secret);

        const currentUsername = clients_connect[client.id] || username;
        const dataUser = users_connect[currentUsername];

        if (!dataUser) {
          return client.emit("info_message", {
            status: 401,
            message: "Please choose a username to continue",
          });
        }

        if (!name_room) return;

        if (!rooms[name_room]) {
          rooms[name_room] = [];
          io.emit("new_room", { new_room: name_room });
        }

        if (!rooms[name_room].includes(currentUsername)) {
          dataUser.currentRoom = name_room;
          users_connect[currentUsername] = dataUser;
          rooms[name_room].push(currentUsername);
        }

        client.join(name_room);
        io.to(name_room).emit("user_entered_room", {
          username: currentUsername,
          colorUser,
          type: "entered_user",
        });
      } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
          return client.emit("info_message", {
            status: 403,
            message: "Invalid authentication token",
          });
        }
      }
    });

    client.on("leave-room", (body) => {
      const { name_room, colorUser, username } = body || {};
      if (!name_room) return;

      client.leave(name_room);
      if (!rooms[name_room]) return;

      const currentUsername = clients_connect[client.id] || username;
      rooms[name_room] = rooms[name_room].filter((u) => u !== currentUsername);

      io.to(name_room).emit("user_leave_room", {
        username: currentUsername,
        colorUser,
        type: "leave_user",
      });

      if (rooms[name_room].length === 0 && !defaultRooms.includes(name_room)) {
        delete rooms[name_room];
        io.emit("delete_room", { name_room });
      }
    });

    client.on("send-message-to-room", (body) => {
      try {
        const { toRoom, text, username, colorUser, tkn } = body || {};
        if (!tkn) {
          return client.emit("info_message", {
            status: 401,
            message: "Authentication token required",
          });
        }

        const secret = process.env.KEY_SECRET || "chatnet_jwt_secret_key_2024";
        jwt.verify(tkn, secret);

        const currentUsername = clients_connect[client.id] || username;
        if (!users_connect[currentUsername]) {
          return client.emit("info_message", {
            status: 401,
            message: "Please choose a username to continue",
          });
        }

        if (toRoom && text && text.trim() !== "") {
          io.to(toRoom).emit("received_message", {
            text: text.trim(),
            colorUser,
            username: currentUsername,
          });
        }
      } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
          return client.emit("info_message", {
            status: 403,
            message: "Invalid authentication token",
          });
        }
      }
    });

    client.on("disconnect", () => {
      const username_delete = clients_connect[client.id];
      if (username_delete) {
        const currentRoomUser = users_connect[username_delete]?.currentRoom;
        if (currentRoomUser && rooms[currentRoomUser]) {
          rooms[currentRoomUser] = rooms[currentRoomUser].filter(
            (u) => u !== username_delete
          );
          io.to(currentRoomUser).emit("user_leave_room", {
            username: username_delete,
            type: "disconnect_user",
          });
        }
        delete users_connect[username_delete];
        delete clients_connect[client.id];
      }
      console.log(`[Socket] Client disconnected: ${client.id}`);
    });
  });
};