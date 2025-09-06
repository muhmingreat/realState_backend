// server/controllers/paymentController.js
const { ethers } = require("ethers");
const nodemailer = require("nodemailer");
const RealEstateABI = require("../abis/RealEstate.json");
const KYCRequest = require("../models/KYCRequest.js");
require("dotenv").config();

const WebSocket = require("ws"); // npm install ws

// ✅ Setup Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email helper
 */
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
}

/**
 * Initialize WebSocket provider to listen for contract events
 */
function initWebSocket() {
  console.log("🔌 Connecting to Alchemy WebSocket...");

  const ws = new WebSocket(process.env.WEBSOCKET_ALCHEMY);

  ws.on("open", () => console.log("✅ WebSocket open"));
  ws.on("error", (err) => console.error("❌ WebSocket error:", err.message));
  ws.on("close", (code, reason) => {
    console.warn(`⚠️ WebSocket closed: ${code} (${reason}). Reconnecting in 5s...`);
    setTimeout(initWebSocket, 5000);
  });

  const provider = new ethers.WebSocketProvider(process.env.WEBSOCKET_ALCHEMY);

  const realEstate = new ethers.Contract(
    process.env.REALESTATE_CONTRACT_ADDRESS,
    RealEstateABI,
    provider
  );

  console.log("📡 Listening for RealEstate contract events...");

  // ✅ Event: PropertyListed
  realEstate.on("PropertyListed", async (id, owner, price) => {
    console.log(`🏠 PropertyListed - ID: ${id}, Owner: ${owner}, Price: ${ethers.formatEther(price)} ETH`);

    const kyc = await KYCRequest.findOne({ walletAddress: owner.toLowerCase() });
    if (kyc) {
      sendEmail(
        kyc.email,
        "Property Listed",
        `Your property (ID: ${id}) has been listed for ${ethers.formatEther(price)} ETH.`
      );
    }
  });

  // ✅ Event: PaymentDeposited
  realEstate.on("PaymentDeposited", async (id, buyer, amount) => {
    console.log(`💰 PaymentDeposited - ID: ${id}, Buyer: ${buyer}, Amount: ${ethers.formatEther(amount)} ETH`);

    const kyc = await KYCRequest.findOne({ walletAddress: buyer.toLowerCase() });
    if (kyc) {
      sendEmail(
        kyc.email,
        "Payment Deposited",
        `Your payment of ${ethers.formatEther(amount)} celo for property ID ${id} has been deposited successfully.`
      );
    }
  });

  // ✅ Event: PropertySold
  realEstate.on("PropertySold", async (id, oldOwner, newOwner, price) => {
    console.log(`🔑 PropertySold - ID: ${id}, OldOwner: ${oldOwner}, NewOwner: ${newOwner}, Price: ${ethers.formatEther(price)} ETH`);

    const oldOwnerKyc = await KYCRequest.findOne({ walletAddress: oldOwner.toLowerCase() });
    const newOwnerKyc = await KYCRequest.findOne({ walletAddress: newOwner.toLowerCase() });

    if (oldOwnerKyc) {
      sendEmail(oldOwnerKyc.email, "Property Sold", `Your property (ID: ${id}) was sold for ${ethers.formatEther(price)} ETH.`);
    }
    if (newOwnerKyc) {
      sendEmail(newOwnerKyc.email, "Purchase Confirmed", `You are now the owner of property (ID: ${id}), purchased for ${ethers.formatEther(price)} ETH.`);
    }
  });

  // ✅ Event: ReviewAdded
  realEstate.on("ReviewAdded", async (productId, reviewer, rating, comment) => {
    console.log(`✍️ ReviewAdded - ProductID: ${productId}, Reviewer: ${reviewer}, Rating: ${rating}, Comment: "${comment}"`);
  });

  // ✅ Event: ReviewLiked
  realEstate.on("ReviewLiked", async (productId, reviewIndex, liker, likes) => {
    console.log(`👍 ReviewLiked - ProductID: ${productId}, ReviewIndex: ${reviewIndex}, Liker: ${liker}, Likes: ${likes}`);
  });

  // ✅ Event: DisputeResolved
  realEstate.on("DisputeResolved", async (id, recipient, refunded) => {
    console.log(`⚖️ DisputeResolved - PropertyID: ${id}, Recipient: ${recipient}, Refunded: ${refunded}`);

    const kyc = await KYCRequest.findOne({ walletAddress: recipient.toLowerCase() });
    if (kyc) {
      sendEmail(
        kyc.email,
        "Dispute Resolved",
        `The dispute for property ID ${id} has been resolved. Refunded: ${refunded}.`
      );
    }
  });
}

// Export function so server.js can call it
exports.paymentController = () => {
  initWebSocket();
};


