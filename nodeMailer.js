// import { ethers } from "ethers";
// import nodemailer from "nodemailer";
// import RealEstateABI from "./abis/realEstateAbi.json";

// const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
// const contractAddress = process.env.REALESTATE_CONTRACT_ADDRESS;
// const contract = new ethers.Contract(contractAddress, RealEstateABI, provider);

// // configure email sender
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // listen for PaymentDeposited event
// contract.on("PaymentDeposited", async (propertyId, buyer, amount) => {
//   console.log(`Payment received: ${amount} for property ${propertyId} by ${buyer}`);

//   // you’d look up buyer/seller emails from your database
//   const buyerEmail = "ayatullahmuhmin3@gmail.com";
//   const sellerEmail = "ayatullahmuhmin@gmail.com";

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: buyerEmail,
//     subject: "Payment Received",
//     text: `We received your payment of ${ethers.formatEther(amount)} ETH for property ${propertyId}.`,
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: sellerEmail,
//     subject: "Buyer Deposited Funds",
//     text: `Buyer ${buyer} has deposited ${ethers.formatEther(amount)} ETH. Please confirm the transaction.`,
//   });
// });
