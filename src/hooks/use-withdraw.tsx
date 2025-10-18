import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "@/lib/beamlink0-idl.json";
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
  const { publicKey, signTransaction } = useWallet();
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

        // Create provider and program
        const provider = new AnchorProvider(
          connection,
          { publicKey: depositId } as any,
          {
            commitment: "confirmed",
          }
        );
        const program = new Program(idl as any, provider);

        // Get deposit PDA
        const [depositPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("deposit"), depositId.toBuffer()],
          PROGRAM_ID
        );

        // Fetch deposit account data
        const depositAccount = await program.account.deposit.fetch(depositPda);

        // Check if deposit is claimed
        const isClaimed = depositAccount.claimed;

        // Get token information
        let token: Token | null = null;
        let usdValue: number | undefined;

        // Check if it's SOL (either isSol flag is true OR mint is default pubkey)
        const isSolDeposit =
          depositAccount.isSol || depositAccount.mint.equals(PublicKey.default);

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
          // SPL token - you might need to fetch token metadata
          // For now, we'll create a basic token object
          token = {
            id: depositAccount.mint.toBase58(),
            name: "Unknown Token",
            symbol: "UNK",
            icon: "",
            decimals: 9,
            usdPrice: 0,
          } as Token;
        }

        // Convert amount from lamports/token units to human readable
        const tokenDecimals = token.decimals ?? 9;
        const amount = (
          Number(depositAccount.amount) / Math.pow(10, tokenDecimals)
        ).toString();

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
    if (!publicKey || !signTransaction || !withdrawInfo) {
      throw new Error("Wallet not connected or no withdraw info available");
    }

    setIsClaiming(true);
    setError(null);

    try {
      // Decode the private key to get the deposit keypair
      const { Keypair } = await import("@solana/web3.js");
      const depositKeypair = Keypair.fromSecretKey(bs58.decode(privateKey!));
      const depositId = depositKeypair.publicKey;

      // Create provider and program
      const wallet = { publicKey, signTransaction } as any;
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = new Program(idl as any, provider);

      // Get deposit PDA
      const [depositPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("deposit"), depositId.toBuffer()],
        PROGRAM_ID
      );

      let tx: Transaction;

      if (withdrawInfo.token && isSolToken(withdrawInfo.token)) {
        // SOL claim
        const [solVault] = PublicKey.findProgramAddressSync(
          [Buffer.from("sol-vault")],
          PROGRAM_ID
        );

        tx = new Transaction().add(
          await program.methods
            .claimSol()
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
        // SPL token claim
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

        tx = new Transaction().add(
          await program.methods
            .claim()
            .accounts({
              user: publicKey,
              mint: mintAddress,
              userAta: userAta,
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

      return signature;
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
