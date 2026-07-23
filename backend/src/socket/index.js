const { Server } = require("socket.io");
const { verifyToken } = require("../services/auth.service");
const battlesService = require("../services/battles.service");
const config = require("../config/env");

function initSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigins,
      methods: ["GET", "POST"],
    },
  });

  battlesService.setIo(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next();
      const decoded = verifyToken(token);
      socket.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
      next();
    } catch {
      next(); // allow anonymous socket connection for viewing
    }
  });

  io.on("connection", (socket) => {
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on("join-battle", ({ battleId }) => {
      if (battleId) {
        socket.join(`battle:${battleId}`);
      }
    });

    socket.on("leave-battle", ({ battleId }) => {
      if (battleId) {
        socket.leave(`battle:${battleId}`);
      }
    });

    socket.on("disconnect", () => {
      if (socket.user) {
        battlesService.leaveQueue(socket.user.id);
      }
    });
  });

  // Server-authoritative timer tick loop (every 1 second)
  setInterval(async () => {
    try {
      const activeRooms = io.sockets.adapter.rooms;
      for (const [roomName] of activeRooms) {
        if (roomName.startsWith("battle:")) {
          const battleId = roomName.replace("battle:", "");
          const battleState = await battlesService.getBattleState(battleId, null);
          if (battleState && battleState.battle) {
            io.to(roomName).emit("timer:tick", {
              battleId,
              remainingSeconds: battleState.remainingSeconds,
              status: battleState.battle.status,
            });

            // If timer reached 0 and battle still active, declare winner
            if (battleState.remainingSeconds <= 0 && battleState.battle.status === "active") {
              await battlesService.maybeDeclareWinner(battleId);
            }
          }
        }
      }
    } catch (err) {
      // Ignore background timer errors
    }
  }, 1000);

  return io;
}

module.exports = { initSocketServer };
