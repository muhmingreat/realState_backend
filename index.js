// index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config");

const kycRoutes = require("./routes/kycRoutes");
const geocodeRoutes = require("./routes/geocodeRoute");
const messageRoutes = require("./routes/messageRoutes");
const { paymentController } = require("./controllers/paymentController");
const KYCRequest = require("./models/KYCRequest");
const Message = require("./models/Message");
const normalizePhone = require("./utils/normalisePhone");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin:[
   "http://localhost:5173 ",
   "https://real-estate-market-place-iota.vercel.app/"],
    credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/tmp_uploads", express.static(path.join(process.cwd(), "tmp_uploads")));

// Routes
app.use("/api/kyc", kycRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/messages", messageRoutes);
paymentController();

// --- Start Server ---
const startServer = async () => {
  try {
    await connectDB();

    const io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join room
      socket.on("joinRoom", (payload) => {
        const room =
          typeof payload === "string"
            ? payload
            : payload?.room || payload?.userId;

        if (!room) return;
        socket.join(room);
        console.log(`📌 Socket ${socket.id} joined room: ${room}`);
      });

      // Handle send message
      socket.on("sendMessage", async (data) => {
        try {
          console.log("📩 Incoming socket data:", data);
         ;

          const { senderWallet, receiverWallet, message, room } = data || {};
          if (!senderWallet || !receiverWallet || !message) {
            return console.error("❌ Missing senderWallet, receiverWallet, or message");
          }

          // 🔍 Lookup sender + receiver (by walletAddress OR email)
          // 🔍 Lookup sender + receiver (walletAddress, email, or phoneNumber)
          const [senderUser, receiverUser] = await Promise.all([
            KYCRequest.findOne({
              $or: [
                { walletAddress: senderWallet },
                { email: senderWallet },
                { phoneNumber: normalizePhone(senderWallet)  },
              ],
            }),
            KYCRequest.findOne({
              $or: [
                { walletAddress: receiverWallet },
                { email: receiverWallet },
                { phoneNumber: normalizePhone(receiverWallet) },
              ],
            }),
          ]);

           console.log("🔍 SenderUser found:", senderUser);
          console.log("🔍 ReceiverUser found:", receiverUser)
          if (!senderUser || !receiverUser) {
            console.error("❌ Sender or Receiver not found in KYC");
            console.error("   senderWallet:", senderWallet);
            console.error("   receiverWallet:", receiverWallet);
            return;
          }


          const computedRoom =
            room ||
            [senderUser.walletAddress, receiverUser.walletAddress].sort().join("_");

          // Save message
          let newMessage = await Message.create({
            sender: senderUser._id,
            receiver: receiverUser._id,
            message,
            room: computedRoom,
          });

          // Populate full info
          newMessage = await newMessage.populate([
            { path: "sender", select: "fullName walletAddress email" },
            { path: "receiver", select: "fullName walletAddress email" },
          ]);

          // Ensure both users join their private wallet rooms
          socket.join(senderUser.walletAddress);
          socket.join(receiverUser.walletAddress);

          // Emit message
          io.to(senderUser.walletAddress)
            .to(receiverUser.walletAddress)
            .to(computedRoom)
            .emit("receiveMessage", newMessage);

          console.log(
            `✅ Message sent from ${senderUser.fullName} to ${receiverUser.fullName}`
          );
        } catch (err) {
          console.error("❌ Error saving message via socket:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();




