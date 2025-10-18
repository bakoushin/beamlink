#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { Keypair, PublicKey } from "@solana/web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const TOKENS = [
  {
    symbol: "SOL",
    name: "Wrapped SOL",
    address: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "USDT",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
  },
  {
    symbol: "BONK",
    name: "BONK",
    address: "6dhTynDkYsVM7cbF7TKfC9DWB636TcEM935fq7JzL2ES",
    decimals: 9,
  },
  {
    symbol: "WIF",
    name: "dogwifcoin",
    address: "Coq3LbB52jzCxk5W8SJTyK3SB83sYTKEjs2JmHaoSGxS",
    decimals: 9,
  },
  {
    symbol: "ORCA",
    name: "Orca",
    address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    decimals: 6,
  },
  {
    symbol: "RAY",
    name: "Raydium",
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
  },
  {
    symbol: "MNGO",
    name: "Mango",
    address: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    decimals: 6,
  },
  {
    symbol: "mSOL",
    name: "Marinade staked SOL",
    address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    decimals: 9,
  },
  {
    symbol: "stSOL",
    name: "Lido staked SOL",
    address: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
    decimals: 9,
  },
];

function loadDefaultKeypair() {
  // First try to get the keypair from Solana CLI config
  let keypairPath = process.env.SOLANA_KEYPAIR;

  if (!keypairPath) {
    try {
      // Try to read from Solana CLI config
      const configPath = path.join(
        os.homedir(),
        ".config",
        "solana",
        "cli",
        "config.yml"
      );
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, "utf8");
        const keypairMatch = config.match(/keypair_path:\s*(.+)/);
        if (keypairMatch) {
          keypairPath = keypairMatch[1].trim();
        }
      }
    } catch (error) {
      // Fall back to default
    }
  }

  // Fall back to default keypair path
  if (!keypairPath) {
    keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  }

  const raw = fs.readFileSync(keypairPath, "utf8");
  const secretKey = Uint8Array.from(JSON.parse(raw));
  if (secretKey.length !== 64) {
    throw new Error(`Unexpected keypair length at ${keypairPath}`);
  }
  const keypair = Keypair.fromSecretKey(secretKey);
  return { secretKey, publicKey: keypair.publicKey.toBase58() };
}

function buildMintAccountData(mintAuthorityPubkey, decimals) {
  const data = Buffer.alloc(82);
  data.writeUInt32LE(1, 0); // mintAuthority option
  new PublicKey(mintAuthorityPubkey).toBuffer().copy(data, 4);
  data.writeBigUInt64LE(0n, 36); // supply
  data.writeUInt8(decimals, 44);
  data.writeUInt8(1, 45); // isInitialized = true
  data.writeUInt32LE(0, 46); // freezeAuthority option = none
  Buffer.alloc(32).copy(data, 50);
  return data;
}

function writeMintAccountJson(outputDir, mint, mintAuthorityPubkey) {
  const data = buildMintAccountData(mintAuthorityPubkey, mint.decimals);
  const accountJson = {
    pubkey: mint.address,
    account: {
      lamports: 1_000_000_000, // 1 SOL keeps the mint safely rent exempt
      data: [data.toString("base64"), "base64"],
      owner: TOKEN_PROGRAM_ID.toBase58(),
      executable: false,
      rentEpoch: 0,
    },
  };

  const filename = `${mint.symbol}-${mint.address}.json`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(accountJson, null, 2));
  return filePath;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const { publicKey } = loadDefaultKeypair();
  const outputDirEnv = process.env.LOCALNET_MINT_OUTPUT;
  const outputDir = outputDirEnv
    ? path.resolve(outputDirEnv)
    : path.resolve(__dirname, "..", "localnet-tokens", "accounts");

  ensureDir(outputDir);

  const manifest = [];
  for (const mint of TOKENS) {
    const filePath = writeMintAccountJson(outputDir, mint, publicKey);
    manifest.push({
      ...mint,
      mintAuthority: publicKey,
    });
  }

  const manifestDir = path.resolve(outputDir, "..");
  ensureDir(manifestDir);

  const manifestPath = path.join(manifestDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const strayManifest = path.join(outputDir, "manifest.json");
  if (fs.existsSync(strayManifest) && strayManifest !== manifestPath) {
    fs.unlinkSync(strayManifest);
  }

  console.log(`Created ${TOKENS.length} mint account files in ${outputDir}`);
  console.log();
  console.log("To reload your validator with these mints, restart it with:");
  console.log(
    `  solana-test-validator --reset --ledger <ledger-dir> --account-dir ${outputDir}`
  );
  console.log();
  console.log(
    "After restart, the default keypair will be the mint authority for each token. " +
      "Use scripts/mint-localnet-tokens.mjs to mint balances on localnet."
  );
  console.log();
  console.log(`Token manifest written to ${manifestPath}`);
}

main();
