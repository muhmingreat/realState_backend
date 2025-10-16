// server/controllers/paymentController.js
const { ethers } = require("ethers");
const nodemailer = require("nodemailer");
const RealEstateABI = require("../abis/RealEstate.json");
const KYCRequest = require("../models/KYCRequest.js");
const {sendEmail}  = require('../utils/email')
require("dotenv").config();

const WebSocket = require("ws"); // npm install ws

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
  realEstate.on("PropertyListed", async (id, owner, propertyTitle, propertyAddress, price) => {
    console.log(`🏠 PropertyListed  ID ${id}, Owner: ${owner}, Price: 
     ${propertyAddress} has been listed for ${Number(ethers.formatEther(price)).toFixed(2)} celo`);

    const kyc = await KYCRequest.findOne({ walletAddress: owner.toLowerCase() });
    if (kyc) {
      sendEmail(
        kyc.email,
        "Property Listed",
        `Your property ID ${id}  with this Title ${ propertyTitle},
         located at ${propertyAddress} has been listed for ${Number(ethers.formatEther(price)).toFixed(2)} celo.`
      );
    }
  });

  // ✅ Event: PaymentDeposited
  realEstate.on("PaymentDeposited", async (id, buyer, amount) => {
    console.log(`💰 PaymentDeposited ID ${id}, Buyer ${buyer}, 
      Amount: ${Number(ethers.formatEther(amount)).toFixed(2)} celo`);

    const kyc = await KYCRequest.findOne({ walletAddress: buyer.toLowerCase() });
    if (kyc) {
      sendEmail(
        kyc.email,
        "Payment Deposited",
        `Your payment of ${Number(ethers.formatEther(price)).toFixed(2)} 
        celo for property ID ${id} has been deposited successfully.`
      );
    }
  });

  // ✅ Event: PropertySold
  realEstate.on("PropertySold", async (id, oldOwner, propertyTitle, propertyAddress, newOwner, price) => {

    console.log(`🔑 PropertySold  ID ${id}, OldOwner: ${oldOwner}, NewOwner: ${newOwner}, Price: 
      ${Number(ethers.formatEther(price)).toFixed(2)} celo`);

    const oldOwnerKyc = await KYCRequest.findOne({ walletAddress: oldOwner.toLowerCase() });
    const newOwnerKyc = await KYCRequest.findOne({ walletAddress: newOwner.toLowerCase() });

    if (oldOwnerKyc) {
      sendEmail(oldOwnerKyc.email, "Property Sold", `this property ID: ${id} located at
         ${propertyAddress} was sold for ${Number(ethers.formatEther(price)).toFixed(2)} celo.`);
    }
    if (newOwnerKyc) {
      sendEmail(newOwnerKyc.email, "Purchase Confirmed", `You are now the owner of property 
         ${propertyTitle}, located at ${propertyAddress} purchased for
         ${Number(ethers.formatEther(price)).toFixed(2)} celo.`);
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


exports.eventController = () => {
  initWebSocket();
};


