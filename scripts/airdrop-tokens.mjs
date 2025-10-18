#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  getMint,
} from "@solana/spl-token";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_AMOUNTS = {
  SOL: "1000",
  USDC: "1000000",
  USDT: "1000000",
  BONK: "1000000000",
  WIF: "1000000",
  ORCA: "100000",
  RAY: "100000",
  MNGO: "100000",
  mSOL: "1000",
  stSOL: "1000",
};

function loadKeypair() {
  let keypairPath = process.env.SOLANA_KEYPAIR;

  if (!keypairPath) {
    try {
      const configPath = path.join(
        os.homedir(),
        ".config",
        "solana",
        "cli",
        "config.yml"
      );
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, "utf8");
        const match = config.match(/keypair_path:\s*(.+)/);
        if (match) keypairPath = match[1].trim();
      }
    } catch (error) {
      // Fall back to default
    }
  }

  if (!keypairPath) {
    keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  }

  if (!fs.existsSync(keypairPath)) {
    console.error(`❌ Keypair not found at ${keypairPath}`);
    console.error("Run: solana-keygen new");
    process.exit(1);
  }

  const secret = Uint8Array.from(
    JSON.parse(fs.readFileSync(keypairPath, "utf8"))
  );
  return Keypair.fromSecretKey(secret);
}

function loadManifest() {
  const manifestPath =
    process.env.LOCALNET_MINT_MANIFEST ||
    path.resolve(__dirname, "..", "localnet-tokens", "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest not found at ${manifestPath}`);
    console.error("Run: npm run localnet:setup");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`Manifest at ${manifestPath} is empty`);
  }
  return raw;
}

function uiAmountToBaseUnits(amountStr, decimals) {
  if (!/^\d+(\.\d+)?$/.test(amountStr)) {
    throw new Error(`Invalid amount "${amountStr}"`);
  }
  const [intPart, fracPart = ""] = amountStr.split(".");
  if (fracPart.length > decimals) {
    throw new Error(
      `Amount "${amountStr}" has more than ${decimals} decimal places`
    );
  }
  const full = intPart + fracPart.padEnd(decimals, "0");
  return BigInt(full);
}

async function checkConnection(connection) {
  try {
    const version = await connection.getVersion();
    console.log(`✅ Connected to Solana ${version["solana-core"]}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to localnet");
    console.error("Run: npm run localnet:start");
    return false;
  }
}

async function airdropSOL(connection, destination, amount) {
  const signature = await connection.requestAirdrop(
    destination,
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
  console.log(`  💰 Airdropped ${amount} SOL to ${destination.toBase58()}`);
  return signature;
}

async function airdropToken(
  connection,
  payer,
  mintAddress,
  destination,
  amount,
  decimals
) {
  try {
    // Get or create associated token account
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintAddress,
      destination
    );

    // Convert UI amount to base units
    const baseAmount = uiAmountToBaseUnits(amount, decimals);

    // Mint tokens to the ATA
    const signature = await mintTo(
      connection,
      payer,
      mintAddress,
      ata.address,
      payer, // mint authority
      baseAmount
    );

    await connection.confirmTransaction(signature);
    return { ata: ata.address, signature };
  } catch (error) {
    console.error(
      `  ❌ Failed to airdrop ${mintAddress.toBase58()}: ${error.message}`
    );
    throw error;
  }
}

async function checkBalances(connection, destination, manifest) {
  console.log("\n📊 Checking balances after airdrop...");

  // Check SOL balance
  const solBalance = await connection.getBalance(destination);
  console.log(`  💰 SOL: ${(solBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  // Check token balances
  for (const mint of manifest) {
    try {
      const mintAddress = new PublicKey(mint.address);
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        new Keypair(), // dummy payer for read-only operation
        mintAddress,
        destination
      );

      const accountInfo = await getAccount(connection, ata.address);
      const mintInfo = await getMint(connection, mintAddress);
      const balance =
        Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals);

      console.log(
        `  🪙 ${mint.symbol}: ${balance.toLocaleString()} ${mint.symbol}`
      );
    } catch (error) {
      console.log(`  ❌ ${mint.symbol}: Unable to check balance`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: npm run localnet:airdrop <wallet-address> [options]");
    console.log(
      "Options: --amount <amount>, --sol <amount>, --tokens-only, --sol-only, --quiet"
    );
    console.log(
      "Example: npm run localnet:airdrop 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
    );
    return;
  }

  const [destArg] = args;
  if (!destArg) {
    console.error("❌ Wallet address required");
    console.error("Usage: npm run localnet:airdrop <wallet-address>");
    process.exit(1);
  }

  // Parse options
  const options = {
    amount: null,
    solAmount: "1000",
    tokensOnly: false,
    solOnly: false,
    checkBalances: true,
    quiet: false,
  };

  const amountIndex = args.indexOf("--amount");
  if (amountIndex !== -1 && args[amountIndex + 1]) {
    options.amount = args[amountIndex + 1];
  }

  const solIndex = args.indexOf("--sol");
  if (solIndex !== -1 && args[solIndex + 1]) {
    options.solAmount = args[solIndex + 1];
  }

  if (args.includes("--tokens-only")) {
    options.tokensOnly = true;
  }

  if (args.includes("--sol-only")) {
    options.solOnly = true;
  }

  if (args.includes("--no-check-balances")) {
    options.checkBalances = false;
  }

  if (args.includes("--quiet")) {
    options.quiet = true;
  }

  try {
    const destination = new PublicKey(destArg);
    const payer = loadKeypair();
    const connectionUrl =
      process.env.SOLANA_URL ||
      process.env.SOLANA_RPC_URL ||
      "http://127.0.0.1:8899";
    const connection = new Connection(connectionUrl, "confirmed");
    const manifest = loadManifest();

    console.log("🚀 Starting token airdrop...");
    console.log(`📍 Target: ${destination.toBase58()}`);
    console.log(`🌐 RPC: ${connectionUrl}`);
    console.log(`💰 Payer: ${payer.publicKey.toBase58()}`);
    console.log("");

    // Check connection
    if (!(await checkConnection(connection))) {
      if (!options.quiet) {
        process.exit(1);
      }
    }

    // Airdrop SOL
    if (!options.tokensOnly) {
      console.log("💰 Airdropping SOL...");
      await airdropSOL(connection, destination, parseFloat(options.solAmount));
    }

    // Airdrop SPL tokens
    if (!options.solOnly) {
      console.log("\n🪙 Airdropping SPL tokens...");

      for (const mint of manifest) {
        // Skip SOL as it's a native token, not an SPL token
        if (mint.symbol === "SOL") {
          continue;
        }

        const mintAddress = new PublicKey(mint.address);
        const amount = options.amount || DEFAULT_AMOUNTS[mint.symbol] || "1000";

        if (!options.quiet) {
          console.log(`  📤 ${mint.symbol}: ${amount} ${mint.symbol}`);
        }

        try {
          const { ata, signature } = await airdropToken(
            connection,
            payer,
            mintAddress,
            destination,
            amount,
            mint.decimals
          );

          if (!options.quiet) {
            console.log(`    ✅ ${mint.symbol} -> ${ata.toBase58()}`);
          }
        } catch (error) {
          console.error(
            `    ❌ Failed to airdrop ${mint.symbol}: ${error.message}`
          );
        }
      }
    }

    console.log("\n✅ Airdrop completed!");

    // Check balances
    if (options.checkBalances) {
      await checkBalances(connection, destination, manifest);
    }
  } catch (error) {
    console.error("❌ Airdrop failed:", error.message);
    process.exit(1);
  }
}

main();
