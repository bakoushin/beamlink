import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

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

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

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

    // Load environment variables
    const RPC_ENDPOINT =
      process.env.SOLANA_RPC_ENDPOINT || process.env.RPC_ENDPOINT;
    const PROGRAM_ID_STR = process.env.PROGRAM_ID;
    const relayerSecretKey = process.env.RELAYER_SECRET_KEY;

    if (!RPC_ENDPOINT) {
      return res.status(500).json({
        success: false,
        error: "RPC endpoint not configured",
      });
    }

    if (!PROGRAM_ID_STR) {
      return res.status(500).json({
        success: false,
        error: "Program ID not configured",
      });
    }

    if (!relayerSecretKey) {
      return res.status(500).json({
        success: false,
        error: "Relayer not configured",
      });
    }

    // Parse the secret key and create keypair
    const secretKeyArray = JSON.parse(relayerSecretKey);
    const relayerKeypair = Keypair.fromSecretKey(
      Uint8Array.from(secretKeyArray)
    );

    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

    // Create connection
    const connection = new Connection(RPC_ENDPOINT, "confirmed");

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

    // 2. Validate deposit details
    const depositIdPubkey = new PublicKey(depositId);
    const [depositPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("deposit"), depositIdPubkey.toBuffer()],
      PROGRAM_ID
    );

    // Fetch deposit account data directly
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

    res.status(200).json({
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
}
