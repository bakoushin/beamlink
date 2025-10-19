import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import idl from "@/lib/beamlink0-idl.json";
import { requestClaim } from "@/lib/claim-api";
import type { Token } from "@/types/token";

// SOL mint address constant
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

// Program ID for local network
const PROGRAM_ID = new PublicKey(
  "7BwYVv3WL2dSTwnvsGHw8LUBoahgG8x5q3fvw6c8pzGW"
);

interface WithdrawInfo {
  depositId: string;
  amount: string;
  token: Token | null;
  isClaimed: boolean;
  usdValue?: number;
  error?: string;
}

interface UseWithdrawReturn {
  withdrawInfo: WithdrawInfo | null;
  isLoading: boolean;
  error: string | null;
  claim: () => Promise<string>;
  isClaiming: boolean;
}

// Helper function to check if a token is SOL
function isSolToken(token: Token): boolean {
  return token.id === SOL_MINT_ADDRESS;
}

export function useWithdraw(privateKey?: string): UseWithdrawReturn {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [withdrawInfo, setWithdrawInfo] = useState<WithdrawInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch withdraw information when privateKey is provided
  useEffect(() => {
    if (!privateKey) {
      setWithdrawInfo(null);
      return;
    }

    const fetchWithdrawInfo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Decode the private key to get the deposit keypair
        const { Keypair } = await import("@solana/web3.js");
        const depositKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        const depositId = depositKeypair.publicKey;

        // No need for program interface - using direct account fetching

        // Get deposit PDA
        const [depositPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("deposit"), depositId.toBuffer()],
          PROGRAM_ID
        );

        // Fetch deposit account data directly (more reliable than program interface)
        const accountInfo = await connection.getAccountInfo(depositPda);
        if (!accountInfo) {
          throw new Error("Deposit account not found");
        }

        // Parse the account data manually
        // Skip the 8-byte discriminator
        const accountData = accountInfo.data.slice(8);

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

        // Debug logging
        console.log("Parsed deposit account:", {
          depositId: depositAccount.depositId.toBase58(),
          mint: depositAccount.mint.toBase58(),
          amount: depositAccount.amount.toString(),
          creator: depositAccount.creator.toBase58(),
          createdAt: depositAccount.createdAt.toString(),
          consumed: depositAccount.consumed,
          isDefaultMint: depositAccount.mint.equals(PublicKey.default),
        });

        // Check if deposit is claimed
        const isClaimed = depositAccount.consumed;

        // Get token information
        let token: Token | null = null;
        let usdValue: number | undefined;

        // Check if it's SOL (mint is default pubkey)
        const isSolDeposit = depositAccount.mint.equals(PublicKey.default);

        console.log("SOL detection:", {
          isDefaultMint: depositAccount.mint.equals(PublicKey.default),
          mintAddress: depositAccount.mint.toBase58(),
          defaultMint: PublicKey.default.toBase58(),
          isSolDeposit: isSolDeposit,
        });

        if (isSolDeposit) {
          // SOL token
          token = {
            id: SOL_MINT_ADDRESS,
            name: "Solana",
            symbol: "SOL",
            icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            decimals: 9,
            usdPrice: 0, // Will be fetched separately
          } as Token;
        } else {
          // SPL token - fetch token metadata from Jupiter API
          try {
            const mintAddress = depositAccount.mint.toBase58();
            console.log("Fetching metadata for mint:", mintAddress);

            const response = await fetch(
              `https://lite-api.jup.ag/tokens/v2/search?query=${mintAddress}`
            );

            if (response.ok) {
              const tokens: Token[] = await response.json();
              console.log("Jupiter API response:", tokens);

              const tokenMetadata = tokens.find((t) => t.id === mintAddress);

              if (tokenMetadata) {
                console.log("Found token metadata:", tokenMetadata);
                token = tokenMetadata;
              } else {
                console.log(
                  "Token not found in Jupiter response, using fallback"
                );
                // Fallback if token not found in Jupiter
                token = {
                  id: mintAddress,
                  name: "Unknown Token",
                  symbol: "UNK",
                  icon: "",
                  decimals: 9,
                  usdPrice: 0,
                } as Token;
              }
            } else {
              console.log("Jupiter API failed with status:", response.status);
              // Fallback if API fails
              token = {
                id: mintAddress,
                name: "Unknown Token",
                symbol: "UNK",
                icon: "",
                decimals: 9,
                usdPrice: 0,
              } as Token;
            }
          } catch (error) {
            console.error("Failed to fetch token metadata:", error);
            // Fallback if fetch fails
            token = {
              id: depositAccount.mint.toBase58(),
              name: "Unknown Token",
              symbol: "UNK",
              icon: "",
              decimals: 9,
              usdPrice: 0,
            } as Token;
          }
        }

        // Convert amount from lamports/token units to human readable
        const tokenDecimals = token.decimals ?? 9;
        const amount = (
          Number(depositAccount.amount) / Math.pow(10, tokenDecimals)
        ).toString();

        // Debug logging for amount calculation
        console.log("Amount calculation debug:", {
          rawAmount: depositAccount.amount.toString(),
          tokenDecimals,
          calculatedAmount: amount,
          tokenSymbol: token.symbol,
          tokenName: token.name,
        });

        // TODO: Fetch USD value from price API
        // For now, we'll set it to undefined
        usdValue = undefined;

        setWithdrawInfo({
          depositId: depositId.toBase58(),
          amount,
          token,
          isClaimed,
          usdValue,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch deposit information";
        setError(errorMessage);
        setWithdrawInfo({
          depositId: "",
          amount: "0",
          token: null,
          isClaimed: false,
          error: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawInfo();
  }, [privateKey, connection]);

  const claim = async (): Promise<string> => {
    if (!publicKey || !withdrawInfo) {
      throw new Error("Wallet not connected or no withdraw info available");
    }

    setIsClaiming(true);
    setError(null);

    try {
      // Decode the private key to get the deposit keypair
      const { Keypair } = await import("@solana/web3.js");
      const depositKeypair = Keypair.fromSecretKey(bs58.decode(privateKey!));
      const depositId = depositKeypair.publicKey;

      // Determine if this is a SOL claim
      const isSol = Boolean(
        withdrawInfo.token && isSolToken(withdrawInfo.token)
      );

      // Create provider and program for transaction building
      const provider = new AnchorProvider(connection, { publicKey } as any, {
        commitment: "confirmed",
      });
      const program = new Program(idl as any, provider);

      // Debug: Check if program methods are available
      console.log("Program methods:", Object.keys(program.methods || {}));
      console.log("Program accounts:", Object.keys(program.account || {}));

      // Get deposit PDA
      const [depositPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deposit"), depositId.toBuffer()],
        PROGRAM_ID
      );

      // Hardcoded relayer public key (for simplicity)
      // TODO: Fetch this from backend in production
      const relayerPublicKey = new PublicKey(
        "3ekMEvTXgoU9MDEviwGV93DMGMrZnhtRNyVvEJuq1Ldr"
      );

      let tx: Transaction;

      if (isSol) {
        // SOL claim transaction - build manually
        const [solVault] = PublicKey.findProgramAddressSync(
          [Buffer.from("sol-vault")],
          PROGRAM_ID
        );

        // Build withdraw_sol instruction manually
        // Accounts: payer, sol_vault, deposit_id, deposit, recipient, system_program
        const withdrawSolInstruction = new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: relayerPublicKey, isSigner: true, isWritable: true }, // payer (relayer)
            { pubkey: solVault, isSigner: false, isWritable: true }, // sol_vault
            { pubkey: depositId, isSigner: true, isWritable: false }, // deposit_id
            { pubkey: depositPda, isSigner: false, isWritable: true }, // deposit (closed to recipient)
            { pubkey: publicKey, isSigner: false, isWritable: true }, // recipient (user)
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            }, // system_program
          ],
          data: Buffer.from([145, 131, 74, 136, 65, 137, 42, 38]), // withdraw_sol discriminator
        });

        tx = new Transaction().add(withdrawSolInstruction);
      } else {
        // SPL token claim transaction
        const mintAddress = new PublicKey(withdrawInfo.token!.id);

        const [vaultAuthority] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault-auth")],
          PROGRAM_ID
        );

        const vaultAta = await getAssociatedTokenAddress(
          mintAddress,
          vaultAuthority,
          true,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const userAta = await getAssociatedTokenAddress(
          mintAddress,
          publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Build claim instruction manually
        const claimInstruction = new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: relayerPublicKey, isSigner: true, isWritable: true }, // payer (relayer)
            { pubkey: mintAddress, isSigner: false, isWritable: false }, // mint
            { pubkey: vaultAuthority, isSigner: false, isWritable: false }, // vault_authority
            { pubkey: vaultAta, isSigner: false, isWritable: true }, // vault_ata
            { pubkey: depositId, isSigner: true, isWritable: false }, // deposit_id
            { pubkey: depositPda, isSigner: false, isWritable: true }, // deposit
            { pubkey: publicKey, isSigner: false, isWritable: true }, // recipient
            { pubkey: userAta, isSigner: false, isWritable: true }, // recipient_ata
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            }, // system_program
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
            {
              pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
              isSigner: false,
              isWritable: false,
            }, // associated_token_program
          ],
          data: Buffer.from([183, 18, 70, 156, 148, 109, 161, 34]), // withdraw discriminator
        });

        tx = new Transaction().add(claimInstruction);
      }

      // Get recent blockhash and set relayer as fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = relayerPublicKey; // Relayer will pay for the transaction

      // The transaction will be signed with only the deposit keypair
      // User's wallet is just the destination, not a signer

      // Sign with ONLY the deposit keypair (from private key in URL)
      console.log("Signing transaction with deposit keypair...");
      tx.sign(depositKeypair);
      console.log("Deposit keypair signature added");

      // Debug: Check signatures
      console.log("Transaction signatures after deposit keypair signing:", {
        signatures: tx.signatures.map((sig) => ({
          publicKey: sig.publicKey.toBase58(),
          signature: sig.signature ? "present" : "missing",
        })),
      });

      // Serialize the partially signed transaction (relayer will complete signing)
      const serializedTx = tx.serialize({ requireAllSignatures: false });
      const transactionBase64 = Buffer.from(serializedTx).toString("base64");

      // Send partially signed transaction to backend (relayer will complete signing)
      const claimRequest = {
        transaction: transactionBase64,
        depositId: depositId.toBase58(),
        userPublicKey: publicKey.toBase58(),
        isSol: isSol,
        mintAddress: isSol ? undefined : withdrawInfo.token?.id,
      };

      console.log("Sending partially signed transaction to relayer");

      const result = await requestClaim(claimRequest);

      if (!result.success) {
        throw new Error(result.error || "Claim request failed");
      }

      return result.signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Claim failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    withdrawInfo,
    isLoading,
    error,
    claim,
    isClaiming,
  };
}
