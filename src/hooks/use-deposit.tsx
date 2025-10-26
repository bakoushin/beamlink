import { useState, useRef, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  SendTransactionError,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "@/lib/beamlink0-idl.json";
import type { Token } from "@/types/token";
import type { UserTokenBalance } from "@/queries";

// SOL mint address constant
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

// Program ID for local network
const PROGRAM_ID = new PublicKey(
  "7BwYVv3WL2dSTwnvsGHw8LUBoahgG8x5q3fvw6c8pzGW"
);

interface DepositResult {
  signature: string;
  depositId: string;
  privateKey: string;
}

interface UseDepositReturn {
  deposit: (
    token: Token | UserTokenBalance,
    amount: string
  ) => Promise<DepositResult>;
  isLoading: boolean;
  error: string | null;
  cancelTransaction: () => void;
  isTransactionPending: boolean;
}

// Helper function to check if a token is SOL
function isSolToken(token: Token | UserTokenBalance): boolean {
  const tokenId = "id" in token ? token.id : token.address;
  return tokenId === SOL_MINT_ADDRESS;
}

export function useDeposit(): UseDepositReturn {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  // Track pending transactions to prevent duplicates
  const pendingTransactionsRef = useRef<Set<string>>(new Set());
  const currentTransactionRef = useRef<string | null>(null);

  const deposit = useCallback(
    async (
      token: Token | UserTokenBalance,
      amount: string
    ): Promise<DepositResult> => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      // Create a unique transaction identifier to prevent duplicates
      const tokenId = "id" in token ? token.id : token.address;
      const transactionId = `${publicKey.toBase58()}-${tokenId}-${amount}-${Date.now()}`;

      // Check if this exact transaction is already pending
      if (pendingTransactionsRef.current.has(transactionId)) {
        throw new Error(
          "This transaction is already being processed. Please wait."
        );
      }

      // Check if there's already a transaction in progress
      if (currentTransactionRef.current) {
        throw new Error(
          "Another transaction is already in progress. Please wait for it to complete."
        );
      }

      setIsLoading(true);
      setIsTransactionPending(true);
      setError(null);
      currentTransactionRef.current = transactionId;
      pendingTransactionsRef.current.add(transactionId);

      // Convert amount to proper format based on token decimals
      const tokenDecimals = token.decimals ?? 9;
      const depositAmount = Math.floor(
        parseFloat(amount) * Math.pow(10, tokenDecimals)
      );

      console.log(
        "Deposit amount:",
        amount,
        "Token decimals:",
        tokenDecimals,
        "Calculated amount:",
        depositAmount,
        "Type:",
        typeof depositAmount
      );

      if (depositAmount <= 0) {
        throw new Error("Invalid deposit amount");
      }

      // Create provider and program
      const wallet = { publicKey, signTransaction } as any;
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = new Program(idl as any, provider);

      // Generate unique deposit ID
      const depositKeypair = new (await import("@solana/web3.js")).Keypair();
      const depositId = depositKeypair.publicKey;

      try {
        const [depositPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("deposit"), depositId.toBuffer()],
          PROGRAM_ID
        );

        const bnAmount = new BN(depositAmount.toString());

        let tx: Transaction;

        // Check if this is a SOL deposit
        if (isSolToken(token)) {
          console.log("Processing SOL deposit");
          console.log("Program ID:", PROGRAM_ID.toBase58());
          console.log("Available methods:", Object.keys(program.methods));

          // Derive SOL vault PDA
          const [solVault] = PublicKey.findProgramAddressSync(
            [Buffer.from("sol-vault")],
            PROGRAM_ID
          );

          console.log("SOL vault PDA:", solVault.toBase58());

          // Build SOL deposit transaction
          tx = new Transaction().add(
            await program.methods
              .depositSol(bnAmount)
              .accounts({
                user: publicKey,
                solVault: solVault,
                depositId: depositId,
                deposit: depositPda,
                systemProgram: SystemProgram.programId,
              })
              .instruction()
          );
        } else {
          console.log("Processing SPL token deposit");

          // Get token mint address
          const tokenId = "id" in token ? token.id : token.address;
          const mintAddress = new PublicKey(tokenId);

          // Derive program accounts for SPL tokens
          const [vaultAuthority] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault-auth")],
            PROGRAM_ID
          );

          const vaultAta = await getAssociatedTokenAddress(
            mintAddress,
            vaultAuthority,
            true, // allow PDA
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );

          // Get or create user's ATA
          const userAta = await getOrCreateAssociatedTokenAccount(
            connection,
            { publicKey, signTransaction } as any,
            mintAddress,
            publicKey
          );

          // Build SPL token deposit transaction
          tx = new Transaction().add(
            await program.methods
              .deposit(bnAmount)
              .accounts({
                user: publicKey,
                mint: mintAddress,
                userAta: userAta.address,
                vaultAuthority: vaultAuthority,
                vaultAta: vaultAta,
                depositId: depositId,
                deposit: depositPda,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              })
              .instruction()
          );
        }

        // Get recent blockhash and set fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        // Send and confirm transaction with retry logic
        const signedTx = await signTransaction(tx);

        let signature: string;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            signature = await connection.sendRawTransaction(
              signedTx.serialize(),
              {
                skipPreflight: false,
                preflightCommitment: "confirmed",
              }
            );
            break; // Success, exit retry loop
          } catch (err) {
            retryCount++;

            if (err instanceof SendTransactionError) {
              const logs = err.logs || [];
              const isAlreadyProcessed = logs.some(
                (log) =>
                  log.includes("This transaction has already been processed") ||
                  log.includes("Transaction simulation failed")
              );

              if (isAlreadyProcessed) {
                // Check if the transaction was actually successful on-chain
                try {
                  // Extract signature from error message (try multiple patterns)
                  let signatureMatch = err.message.match(
                    /Transaction ([A-Za-z0-9]{64,88}) resulted in an error/
                  );
                  if (!signatureMatch) {
                    // Try alternative pattern for simulation errors
                    signatureMatch = err.message.match(
                      /Transaction ([A-Za-z0-9]{64,88})/
                    );
                  }
                  if (signatureMatch) {
                    const txSignature = signatureMatch[1];
                    // Check if the transaction was confirmed
                    const txStatus = await connection.getSignatureStatus(
                      txSignature,
                      {
                        searchTransactionHistory: true,
                      }
                    );

                    if (
                      txStatus.value?.confirmationStatus &&
                      txStatus.value.err === null
                    ) {
                      // Transaction was successful despite simulation error
                      console.log(
                        "Transaction was successful despite simulation error:",
                        txSignature
                      );
                      signature = txSignature;
                      break;
                    }
                  }
                } catch (statusErr) {
                  console.warn(
                    "Failed to check transaction status:",
                    statusErr
                  );
                }

                if (retryCount < maxRetries) {
                  console.warn(
                    `Transaction already processed, retrying... (${retryCount}/${maxRetries})`
                  );
                  // Wait a bit before retrying
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * retryCount)
                  );
                  continue;
                }
              }
            }

            // If we've exhausted retries or it's not a retryable error, throw
            if (retryCount >= maxRetries) {
              throw err;
            }
          }
        }

        if (!signature!) {
          throw new Error("Failed to send transaction after multiple attempts");
        }

        await connection.confirmTransaction(signature, "confirmed");

        const result: DepositResult = {
          signature,
          depositId: depositId.toBase58(),
          privateKey: bs58.encode(depositKeypair.secretKey),
        };

        return result;
      } catch (err) {
        let errorMessage = "Unknown error occurred";

        if (err instanceof SendTransactionError) {
          const logs = err.logs || [];
          if (
            logs.some((log) =>
              log.includes("This transaction has already been processed")
            )
          ) {
            // Check if the transaction was actually successful despite the error
            try {
              // Extract signature from error message (try multiple patterns)
              let signatureMatch = err.message.match(
                /Transaction ([A-Za-z0-9]{64,88}) resulted in an error/
              );
              if (!signatureMatch) {
                // Try alternative pattern for simulation errors
                signatureMatch = err.message.match(
                  /Transaction ([A-Za-z0-9]{64,88})/
                );
              }
              if (signatureMatch) {
                const txSignature = signatureMatch[1];
                const txStatus = await connection.getSignatureStatus(
                  txSignature,
                  {
                    searchTransactionHistory: true,
                  }
                );

                if (
                  txStatus.value?.confirmationStatus &&
                  txStatus.value.err === null
                ) {
                  // Transaction was successful, return the result instead of throwing
                  const result: DepositResult = {
                    signature: txSignature,
                    depositId: depositId.toBase58(),
                    privateKey: bs58.encode(depositKeypair.secretKey),
                  };
                  return result;
                }
              }
            } catch (statusErr) {
              console.warn(
                "Failed to check transaction status in catch block:",
                statusErr
              );
            }

            errorMessage =
              "Transaction was already processed. Please check your wallet or try again.";
          } else if (logs.some((log) => log.includes("insufficient funds"))) {
            errorMessage = "Insufficient funds for this transaction.";
          } else {
            errorMessage = `Transaction failed: ${err.message}`;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
        setIsTransactionPending(false);
        currentTransactionRef.current = null;
        pendingTransactionsRef.current.delete(transactionId);
      }
    },
    [connection, publicKey, signTransaction]
  );

  const cancelTransaction = useCallback(() => {
    setIsLoading(false);
    setIsTransactionPending(false);
    setError(null);
    currentTransactionRef.current = null;
    // Clear all pending transactions
    pendingTransactionsRef.current.clear();
  }, []);

  return {
    deposit,
    isLoading,
    error,
    cancelTransaction,
    isTransactionPending,
  };
}
