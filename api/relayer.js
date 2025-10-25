// Vercel Serverless Function for Relayer Public Key
import { Keypair } from "@solana/web3.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Load relayer keypair from environment variable
    const relayerSecretKey = process.env.RELAYER_SECRET_KEY;

    if (!relayerSecretKey) {
      console.error("RELAYER_SECRET_KEY environment variable not set");
      return res.status(500).json({
        success: false,
        error: "Relayer not configured",
      });
    }

    // Parse the secret key (should be a JSON array of numbers)
    const secretKeyArray = JSON.parse(relayerSecretKey);
    const relayerKeypair = Keypair.fromSecretKey(
      Uint8Array.from(secretKeyArray)
    );

    res.status(200).json({
      success: true,
      relayerPublicKey: relayerKeypair.publicKey.toBase58(),
    });
  } catch (error) {
    console.error("Error in relayer endpoint:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
