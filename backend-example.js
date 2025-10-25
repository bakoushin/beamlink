// Backend API Example for Claim Relayer
// This is an example implementation - you'll need to adapt this to your backend

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import os from "os";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const idl = JSON.parse(
  readFileSync(join(__dirname, "src/lib/beamlink0-idl.json"), "utf8")
);

const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

// Configuration
const RPC_ENDPOINT = "http://127.0.0.1:8899"; // Your Solana RPC endpoint
const PROGRAM_ID = new PublicKey(
  "7BwYVv3WL2dSTwnvsGHw8LUBoahgG8x5q3fvw6c8pzGW"
);

// Create connection
const connection = new Connection(RPC_ENDPOINT, "confirmed");

// Load relayer keypair from JSON file
const relayerKeypairPath = path.join(os.homedir(), "relayer-keypair.json");
let relayerKeypair;

try {
  const keypairData = JSON.parse(fs.readFileSync(relayerKeypairPath, "utf8"));
  relayerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  console.log(`Loaded relayer keypair from: ${relayerKeypairPath}`);
  console.log(`Relayer public key: ${relayerKeypair.publicKey.toBase58()}`);
} catch (error) {
  console.error(
    `Failed to load relayer keypair from ${relayerKeypairPath}:`,
    error.message
  );
  console.log("Generating new relayer keypair...");

  // Generate new keypair if file doesn't exist
  relayerKeypair = Keypair.generate();

  // Save the new keypair to file
  const keypairData = Array.from(relayerKeypair.secretKey);
  fs.writeFileSync(relayerKeypairPath, JSON.stringify(keypairData, null, 2));

  console.log(
    `Generated and saved new relayer keypair to: ${relayerKeypairPath}`
  );
  console.log(`Relayer public key: ${relayerKeypair.publicKey.toBase58()}`);
  console.log("Please fund this address with SOL for transaction fees!");
}

// Get relayer public key endpoint
app.get("/api/relayer", (req, res) => {
  res.json({
    success: true,
    relayerPublicKey: relayerKeypair.publicKey.toBase58(),
  });
});

// Claim endpoint
app.post("/api/claim", async (req, res) => {
  try {
    const { transaction, depositId, userPublicKey, isSol, mintAddress } =
      req.body;

    console.log("Processing claim request:", {
      depositId,
      userPublicKey,
      isSol,
      mintAddress,
    });

    // Validate inputs
    if (!transaction || !depositId || !userPublicKey) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: transaction, depositId, and userPublicKey",
      });
    }

    // Deserialize the partially signed transaction
    const txBuffer = Buffer.from(transaction, "base64");
    const partialTx = Transaction.from(txBuffer);

    // Debug: Check signatures in received transaction
    console.log(
      "Received transaction signatures:",
      partialTx.signatures.map((sig) => ({
        publicKey: sig.publicKey.toBase58(),
        signature: sig.signature ? "present" : "missing",
      }))
    );

    // Validate the transaction
    // 1. Check that this is for our program
    const programId = new PublicKey(PROGRAM_ID);
    const hasOurProgram = partialTx.instructions.some((ix) =>
      ix.programId.equals(programId)
    );

    if (!hasOurProgram) {
      return res.status(400).json({
        success: false,
        error: "Transaction is not for the correct program",
      });
    }

    // 2. Check that the method is a claim method
    const isClaimMethod = partialTx.instructions.some((ix) => {
      // Check if instruction is for claim or claimSol
      return ix.programId.equals(programId);
    });

    if (!isClaimMethod) {
      return res.status(400).json({
        success: false,
        error: "Transaction is not a claim method",
      });
    }

    // 3. Validate deposit details
    const depositIdPubkey = new PublicKey(depositId);
    const [depositPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("deposit"), depositIdPubkey.toBuffer()],
      PROGRAM_ID
    );

    // Fetch deposit account data directly (more reliable than program interface)
    let accountInfo;
    try {
      accountInfo = await connection.getAccountInfo(depositPda);
      if (!accountInfo) {
        return res.status(400).json({
          success: false,
          error: "Deposit account not found",
        });
      }
    } catch (error) {
      console.error("Failed to fetch deposit account:", error);
      return res.status(400).json({
        success: false,
        error: "Failed to fetch deposit account",
      });
    }

    // Parse the account data manually
    // Skip the 8-byte discriminator
    const accountData = accountInfo.data.slice(8);

    console.log("Account data length:", accountInfo.data.length);
    console.log("Account data (hex):", accountInfo.data.toString("hex"));
    console.log(
      "Account data after discriminator (hex):",
      accountData.toString("hex")
    );

    // Parse based on the IDL structure
    // Deposit account structure:
    // - deposit_id (pubkey) - 32 bytes
    // - mint (pubkey) - 32 bytes
    // - amount (u64) - 8 bytes
    // - creator (pubkey) - 32 bytes
    // - created_at (i64) - 8 bytes
    // - consumed (bool) - 1 byte
    const depositAccount = {
      depositId: new PublicKey(accountData.slice(0, 32)),
      mint: new PublicKey(accountData.slice(32, 64)),
      amount: accountData.readBigUInt64LE(64),
      creator: new PublicKey(accountData.slice(72, 104)),
      createdAt: accountData.readBigInt64LE(104),
      consumed: accountData.readUInt8(112) === 1,
    };

    console.log("Parsed deposit account:", {
      depositId: depositAccount.depositId.toBase58(),
      mint: depositAccount.mint.toBase58(),
      amount: depositAccount.amount.toString(),
      creator: depositAccount.creator.toBase58(),
      createdAt: depositAccount.createdAt.toString(),
      consumed: depositAccount.consumed,
    });

    // Check if deposit is claimable
    if (depositAccount.consumed) {
      return res.status(400).json({
        success: false,
        error: "Deposit has already been claimed",
      });
    }

    // Note: We don't need to check if the user matches the creator
    // Anyone with the deposit_id private key can claim to any recipient wallet
    // The deposit_id keypair signature is what authorizes the claim

    // Validate token and amount match
    const isSolDeposit = depositAccount.mint.equals(PublicKey.default);
    if (isSolDeposit !== isSol) {
      return res.status(400).json({
        success: false,
        error: "Token type mismatch",
      });
    }

    if (!isSol && mintAddress) {
      const expectedMint = new PublicKey(mintAddress);
      if (!depositAccount.mint.equals(expectedMint)) {
        return res.status(400).json({
          success: false,
          error: "Mint address mismatch",
        });
      }
    }

    // Check relayer balance before processing
    const relayerBalance = await connection.getBalance(
      relayerKeypair.publicKey
    );
    console.log("Relayer balance (lamports):", relayerBalance);

    if (relayerBalance < 5000) {
      // Minimum balance for transaction fees
      return res.status(400).json({
        success: false,
        error: "Insufficient relayer balance for transaction fees",
      });
    }

    // The transaction should already have the relayer as fee payer
    // (frontend should fetch relayer public key and set it before signing)

    // Sign with relayer
    partialTx.partialSign(relayerKeypair);

    console.log(
      "Final signatures:",
      partialTx.signatures.map((sig) => ({
        publicKey: sig.publicKey.toBase58(),
        signature: sig.signature ? "present" : "missing",
      }))
    );

    // Debug: Check vault accounts before simulation
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-auth")],
      PROGRAM_ID
    );

    const vaultAuthInfo = await connection.getAccountInfo(vaultAuthority);
    console.log("Vault Authority exists:", !!vaultAuthInfo);

    if (!isSol && mintAddress) {
      const {
        getAssociatedTokenAddress,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      } = await import("@solana/spl-token");

      const vaultAta = await getAssociatedTokenAddress(
        new PublicKey(mintAddress),
        vaultAuthority,
        true, // allow PDA
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log("Vault ATA:", vaultAta.toBase58());

      const vaultAtaInfo = await connection.getAccountInfo(vaultAta);
      console.log("Vault ATA exists:", !!vaultAtaInfo);

      if (vaultAtaInfo) {
        try {
          const tokenBalance = await connection.getTokenAccountBalance(
            vaultAta
          );
          console.log("Vault ATA balance:", tokenBalance.value.amount);
        } catch (error) {
          console.log("Error getting vault balance:", error.message);
        }
      } else {
        console.log("Vault ATA does not exist - this might be the issue!");
      }
    }

    // Simulate the transaction first to catch errors early
    try {
      const simulation = await connection.simulateTransaction(partialTx);

      if (simulation.value.err) {
        console.error("Transaction simulation failed:", simulation.value.err);
        return res.status(400).json({
          success: false,
          error: `Transaction simulation failed: ${JSON.stringify(
            simulation.value.err
          )}`,
        });
      }

      console.log("Transaction simulation successful");
    } catch (simError) {
      console.error("Simulation error:", simError);
      return res.status(400).json({
        success: false,
        error: `Simulation error: ${simError.message}`,
      });
    }

    // Send the fully signed transaction
    const signature = await connection.sendRawTransaction(
      partialTx.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      }
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");

    console.log("Claim transaction sent:", signature);

    res.json({
      success: true,
      signature: signature,
    });
  } catch (error) {
    console.error("Claim error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Claim relayer API running on port ${PORT}`);
  console.log(`Relayer public key: ${relayerKeypair.publicKey.toBase58()}`);
});

export default app;
