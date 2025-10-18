// Claim API service for relayer-based claim transactions

interface ClaimRequest {
  transaction: string; // base64 encoded partially signed transaction
  depositId: string;
  userPublicKey: string;
  isSol: boolean;
  mintAddress?: string;
}

interface ClaimResponse {
  signature: string;
  success: boolean;
  error?: string;
}

// API base URL - you can configure this based on your environment
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Request a claim transaction to be signed and sent by the relayer
 */
export async function requestClaim(
  request: ClaimRequest
): Promise<ClaimResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Claim API error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to request claim transaction"
    );
  }
}
