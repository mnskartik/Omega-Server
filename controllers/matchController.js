let waitingUser = null;

export function setupMatchmaking(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("findPartner", () => {
      console.log("Looking for partner:", socket.id);

      // If no waiting user → store this user
      if (!waitingUser) {
        waitingUser = socket.id;
        io.to(socket.id).emit("matchStatus", "Searching...");
        return;
      }

      // DO NOT MATCH USER TO HIMSELF
      if (waitingUser === socket.id) {
        console.log("User tried to match with himself, ignoring.");
        return;
      }

      // Found 2 users → match them
      let partner = waitingUser;

      io.to(socket.id).emit("partnerFound", partner);
      io.to(partner).emit("partnerFound", socket.id);

      console.log(`Matched: ${socket.id} ↔ ${partner}`);

      waitingUser = null; // queue reset
    });

    socket.on("disconnect", () => {
      if (waitingUser === socket.id) waitingUser = null;
      console.log("Disconnected:", socket.id);
    });
  });
}
