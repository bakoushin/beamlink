import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
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

  const deposit = async (
    token: Token | UserTokenBalance,
    amount: string
  ): Promise<DepositResult> => {
    if (!publicKey || !signTransaction) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
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

      // Send and confirm transaction
      const signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      await connection.confirmTransaction(signature, "confirmed");

      const result: DepositResult = {
        signature,
        depositId: depositId.toBase58(),
        privateKey: bs58.encode(depositKeypair.secretKey),
      };

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTransaction = () => {
    setIsLoading(false);
    setError(null);
  };

  return {
    deposit,
    isLoading,
    error,
    cancelTransaction,
  };
}
