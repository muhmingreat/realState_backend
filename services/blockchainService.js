// src/services/blockchainService.js
const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const kycAbi = require("../abis/KYCVerifier.json");

// Load KYC contract
const kycContract = new ethers.Contract(
  process.env.KYC_CONTRACT_ADDRESS,
  kycAbi,
  wallet
);

/**
 * Approve KYC for a given wallet address on-chain
 * @param {string} userAddress - The wallet address to approve
 * @returns {Promise<{txHash: string, blockNumber: number}>}
 */
exports.verifyOnChain = async (userAddress) => {
  try {
    // Normalize address
    const address = ethers.getAddress(userAddress);

    // Call the contract method (update if your contract uses a different name)
    const tx = await kycContract.setKYCApproved(address, true);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error("On-chain KYC approval transaction failed");
    }

    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("❌ verifyOnChain error:", error);
    throw new Error(`Failed to approve KYC on-chain: ${error.message}`);
  }
};

