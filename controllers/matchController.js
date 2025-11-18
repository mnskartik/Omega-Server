let waitingUser = null;

export function setupMatchmaking(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("findPartner", () => {
      console.log("User searching:", socket.id);

      // if no one waiting → this user becomes the waiting user
      if (!waitingUser) {
        waitingUser = socket.id;
        io.to(socket.id).emit("matchStatus", "Searching...");
        return;
      }

      // prevent matching user with himself
      if (waitingUser === socket.id) {
        console.log("Ignoring self-match", socket.id);
        return;
      }

      // MATCH them
      io.to(socket.id).emit("partnerFound", waitingUser);
      io.to(waitingUser).emit("partnerFound", socket.id);

      console.log(`Matched: ${socket.id} ↔ ${waitingUser}`);

      waitingUser = null;
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (waitingUser === socket.id) {
        waitingUser = null;
      }
    });
  });
}
