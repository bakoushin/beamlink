#!/usr/bin/env node
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findValidatorProcesses() {
  try {
    // Find solana-test-validator processes
    const result = execSync('pgrep -f "solana-test-validator"', {
      encoding: "utf8",
    });
    return result
      .trim()
      .split("\n")
      .filter((pid) => pid.length > 0);
  } catch (error) {
    return [];
  }
}

function killValidatorProcesses(pids) {
  if (pids.length === 0) {
    console.log("ℹ️  No validator processes found");
    return;
  }

  console.log(`🛑 Stopping ${pids.length} validator process(es)...`);

  for (const pid of pids) {
    try {
      process.kill(parseInt(pid), "SIGTERM");
      console.log(`  ✅ Stopped process ${pid}`);
    } catch (error) {
      console.log(`  ⚠️  Could not stop process ${pid}: ${error.message}`);
    }
  }

  // Wait a moment for graceful shutdown
  setTimeout(() => {
    // Force kill any remaining processes
    const remainingPids = findValidatorProcesses();
    if (remainingPids.length > 0) {
      console.log("🔨 Force killing remaining processes...");
      for (const pid of remainingPids) {
        try {
          process.kill(parseInt(pid), "SIGKILL");
          console.log(`  🔨 Force killed process ${pid}`);
        } catch (error) {
          console.log(
            `  ⚠️  Could not force kill process ${pid}: ${error.message}`
          );
        }
      }
    }
  }, 2000);
}

function cleanupLedger(ledgerDir, keepLedger = false) {
  if (keepLedger) {
    console.log("ℹ️  Keeping ledger data (--keep-ledger specified)");
    return;
  }

  if (!fs.existsSync(ledgerDir)) {
    console.log("ℹ️  No ledger directory found");
    return;
  }

  console.log("🧹 Cleaning up ledger directory...");

  try {
    // Remove ledger files but keep the directory structure
    const files = fs.readdirSync(ledgerDir);
    let removedCount = 0;

    for (const file of files) {
      const filePath = path.join(ledgerDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        removedCount++;
      } else if (stat.isDirectory() && file !== "accounts") {
        // Remove subdirectories but keep accounts
        fs.rmSync(filePath, { recursive: true, force: true });
        removedCount++;
      }
    }

    console.log(`  ✅ Removed ${removedCount} files/directories`);
  } catch (error) {
    console.log(`  ⚠️  Could not clean ledger directory: ${error.message}`);
  }
}

function showStatus() {
  console.log("📊 Localnet Status:");

  // Check if validator is running
  const pids = findValidatorProcesses();
  if (pids.length > 0) {
    console.log(`  🔴 Validator running (${pids.length} process(es))`);
  } else {
    console.log("  🟢 No validator processes found");
  }

  // Check ledger directory
  const ledgerDir = path.resolve(__dirname, "..", "test-ledger");
  if (fs.existsSync(ledgerDir)) {
    const files = fs.readdirSync(ledgerDir);
    console.log(`  📁 Ledger directory exists (${files.length} items)`);
  } else {
    console.log("  📁 No ledger directory found");
  }

  // Check mint accounts
  const accountDir = path.resolve(
    __dirname,
    "..",
    "localnet-tokens",
    "accounts"
  );
  if (fs.existsSync(accountDir)) {
    const accountFiles = fs
      .readdirSync(accountDir)
      .filter((f) => f.endsWith(".json"));
    console.log(`  🪙 Mint accounts: ${accountFiles.length} files`);
  } else {
    console.log("  🪙 No mint accounts found");
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: npm run localnet:stop [options]");
    console.log("Options: --keep-ledger, --status, --force");
    return;
  }

  const keepLedger = args.includes("--keep-ledger");
  const statusOnly = args.includes("--status");
  const force = args.includes("--force");

  if (statusOnly) {
    showStatus();
    return;
  }

  console.log("🛑 Stopping Solana localnet...");
  console.log("");

  // Find and stop validator processes
  const pids = findValidatorProcesses();
  if (pids.length > 0) {
    killValidatorProcesses(pids);
  } else {
    console.log("ℹ️  No validator processes found");
  }

  // Clean up ledger if requested
  const ledgerDir = path.resolve(__dirname, "..", "test-ledger");
  if (!keepLedger) {
    cleanupLedger(ledgerDir, keepLedger);
  }

  console.log("");
  console.log("✅ Localnet stopped successfully");

  if (keepLedger) {
    console.log("ℹ️  Ledger data preserved for next startup");
  } else {
    console.log("ℹ️  Ledger data cleaned up");
  }

  console.log("");
  showStatus();
}

main();
