#!/usr/bin/env node
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  rpcPort: 8899,
  ledgerDir: path.resolve(__dirname, "..", "test-ledger"),
  accountDir: path.resolve(__dirname, "..", "localnet-tokens", "accounts"),
  reset: true,
  quiet: false,
  limitLedgerSize: "50000000",
  slotsPerEpoch: 100,
  faucetSol: "1000000000000000000",
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getSolanaTestValidatorPath() {
  try {
    return execSync("which solana-test-validator", { encoding: "utf8" }).trim();
  } catch (error) {
    console.error("❌ solana-test-validator not found in PATH");
    console.error(
      "Install: https://docs.solana.com/cli/install-solana-cli-tools"
    );
    process.exit(1);
  }
}

function buildValidatorArgs() {
  const args = [
    "--reset",
    `--ledger=${CONFIG.ledgerDir}`,
    `--account-dir=${CONFIG.accountDir}`,
    `--rpc-port=${CONFIG.rpcPort}`,
    `--limit-ledger-size=${CONFIG.limitLedgerSize}`,
    `--slots-per-epoch=${CONFIG.slotsPerEpoch}`,
    `--faucet-sol=${CONFIG.faucetSol}`,
  ];

  if (CONFIG.quiet) args.push("--quiet");
  return args;
}

function startValidator() {
  console.log("🚀 Starting Solana localnet...");
  console.log(`🌐 RPC: http://127.0.0.1:${CONFIG.rpcPort}`);

  ensureDir(CONFIG.ledgerDir);
  ensureDir(CONFIG.accountDir);

  const accountFiles = fs
    .readdirSync(CONFIG.accountDir)
    .filter((f) => f.endsWith(".json"));
  if (accountFiles.length === 0) {
    console.log("⚠️  No mint accounts found. Run: npm run localnet:setup");
    return;
  }

  console.log(`✅ Found ${accountFiles.length} mint accounts`);

  const validator = spawn(getSolanaTestValidatorPath(), buildValidatorArgs(), {
    stdio: ["pipe", "pipe", "pipe"],
    detached: false,
  });

  validator.stdout.on("data", (data) => {
    const output = data.toString();
    if (output.includes("RPC URL:") || output.includes("Faucet URL:")) {
      console.log("✅ Localnet ready!");
      console.log(output);
    } else if (!CONFIG.quiet) {
      console.log(output.trim());
    }
  });

  validator.stderr.on("data", (data) => {
    const output = data.toString();
    if (output.includes("error") || output.includes("Error")) {
      console.error("❌ Error:", output);
    } else if (!CONFIG.quiet) {
      console.log(output.trim());
    }
  });

  validator.on("close", (code) => {
    if (code !== 0) console.error(`❌ Validator exited with code ${code}`);
    else console.log("✅ Validator stopped");
  });

  validator.on("error", (error) => {
    console.error("❌ Failed to start:", error.message);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping...");
    validator.kill("SIGTERM");
    process.exit(0);
  });

  return validator;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: npm run localnet:start [options]");
    console.log("Options: --quiet, --no-reset, --port <port>");
    return;
  }

  if (args.includes("--quiet")) CONFIG.quiet = true;
  if (args.includes("--no-reset")) CONFIG.reset = false;

  const portIndex = args.indexOf("--port");
  if (portIndex !== -1 && args[portIndex + 1]) {
    CONFIG.rpcPort = parseInt(args[portIndex + 1]);
  }

  startValidator();
}

main();
