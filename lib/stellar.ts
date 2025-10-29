import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  StrKey,
} from "@stellar/stellar-sdk";
import axios from "axios";
import { twoDecimals, postSlack } from "./utils";
import { Payout } from "@prisma/client";
import prisma from "./prisma";

export const GLO_STELLAR =
  "GBBS25EGYQPGEZCGCFBKG4OAGFXU6DSOQBGTHELLJT3HZXZJ34HWS6XV";

// Common Stellar token decimals mapping
const STELLAR_TOKEN_DECIMALS: Record<string, number> = {
  USDGLO: 7,
  XLM: 7,
  USDC: 7,
};

function getTokenDecimals(tokenSymbol: string): number {
  return STELLAR_TOKEN_DECIMALS[tokenSymbol.toUpperCase()] || 7; // Default to 7
}

// Lazy initialization of Horizon server to avoid env var issues at module load time
let _server: Horizon.Server | null = null;
function getServer(): Horizon.Server {
  if (!_server) {
    const horizonUrl =
      process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";
    _server = new Horizon.Server(horizonUrl);
  }
  return _server;
}

export function validateStellarAddress(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

export function validateStellarSecret(secret: string): boolean {
  try {
    return StrKey.isValidEd25519SecretSeed(secret);
  } catch {
    return false;
  }
}

export function validateStellarEnvironment(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const privateKey = process.env.STELLAR_PAYOUT_PRIVATE_KEY;
  if (!privateKey) {
    errors.push(
      "STELLAR_PAYOUT_PRIVATE_KEY environment variable is required"
    );
  } else if (!validateStellarSecret(privateKey)) {
    errors.push(
      "STELLAR_PAYOUT_PRIVATE_KEY is not a valid Stellar secret key"
    );
  }

  const horizonUrl = process.env.STELLAR_HORIZON_URL;
  if (horizonUrl && !horizonUrl.startsWith("https://")) {
    errors.push("STELLAR_HORIZON_URL must be a valid HTTPS URL");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function getStellarBalance(
  address: string,
  token: string = "USDGLO",
  issuer: string = GLO_STELLAR
): Promise<number> {
  try {
    if (!address || !token || !issuer) {
      console.error(
        `getStellarBalance: Invalid parameters - address=${!!address}, token=${!!token}, issuer=${!!issuer}`
      );
      return 0;
    }

    if (!validateStellarAddress(address)) {
      console.error(
        `getStellarBalance: Invalid Stellar address format - ${address}`
      );
      return 0;
    }

    console.log(`Fetching ${token} balance for ${address}`);
    const account = await getServer().loadAccount(address);

    const tokenBalance = account.balances.find(
      (bal) =>
        (bal.asset_type === "credit_alphanum4" ||
          bal.asset_type === "credit_alphanum12") &&
        bal.asset_code === token &&
        bal.asset_issuer === issuer
    );

    if (tokenBalance) {
      const balance = parseFloat(tokenBalance.balance);
      console.log(`Found ${token} balance: ${balance}`);
      return balance;
    }

    console.log(`No ${token} balance found for ${address}`);
    return 0;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status ===
        "number" &&
      (error as { response: { status: number } }).response.status === 404
    ) {
      console.warn(
        `getStellarBalance: Account ${address} not found on Stellar network`
      );
      return 0;
    } else {
      console.error(
        `getStellarBalance: Failed to fetch ${token} balance for ${address} - ${errorMsg}`
      );
      return 0;
    }
  }
}

export async function getStellarNativeBalance(
  address: string
): Promise<number> {
  try {
    if (!address) {
      console.error("getStellarNativeBalance: Invalid address parameter");
      return 0;
    }

    if (!validateStellarAddress(address)) {
      console.error(
        `getStellarNativeBalance: Invalid Stellar address format - ${address}`
      );
      return 0;
    }

    console.log(`Fetching XLM balance for ${address}`);
    const account = await getServer().loadAccount(address);

    const nativeBalance = account.balances.find(
      (bal) => bal.asset_type === "native"
    );

    if (nativeBalance) {
      const balance = parseFloat(nativeBalance.balance);
      console.log(`Found XLM balance: ${balance}`);
      return balance;
    }

    console.log(`No XLM balance found for ${address}`);
    return 0;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status ===
        "number" &&
      (error as { response: { status: number } }).response.status === 404
    ) {
      console.warn(
        `getStellarNativeBalance: Account ${address} not found on Stellar network`
      );
      return 0;
    } else {
      console.error(
        `getStellarNativeBalance: Failed to fetch XLM balance for ${address} - ${errorMsg}`
      );
      return 0;
    }
  }
}

export async function getContractData(contract: string): Promise<Dict> {
  const maxRetries = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.stellar.expert/explorer/public/contract/${contract}/value`;
      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Spinach-DeFi-Bot/1.0",
        },
      });

      if (!res.data?.trustlines) {
        console.warn(`No trustlines data found for contract ${contract}`);
        return {};
      }

      const tokens: Dict = res.data.trustlines.reduce(
        (acc: Dict, cur: { value: number; asset: string }) => {
          if (cur.value && cur.asset) {
            const tokenSymbol = cur.asset.split("-")[0];
            const decimals = getTokenDecimals(tokenSymbol);
            // Use floating-point division to preserve decimals
            const tokenValue = Number(cur.value) / Math.pow(10, decimals);
            return { ...acc, [tokenSymbol]: tokenValue };
          }
          return acc;
        },
        {}
      );

      console.log(
        `Successfully fetched contract data for ${contract}: ${Object.keys(tokens).join(", ")}`
      );
      return tokens;
    } catch (error: unknown) {
      const isLastAttempt = attempt === maxRetries;

      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ECONNABORTED"
      ) {
        console.error(
          `Timeout fetching contract data for ${contract} (attempt ${attempt}/${maxRetries})`
        );
      } else if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response
          ?.status === "number" &&
        (error as { response: { status: number } }).response.status >= 400
      ) {
        const resp = (
          error as { response: { status: number; statusText?: string } }
        ).response;
        console.error(
          `HTTP ${resp.status} error for contract ${contract}: ${resp.statusText || "Unknown"}`
        );
      } else {
        console.error(
          `Network error fetching contract ${contract} (attempt ${attempt}/${maxRetries}):`,
          error instanceof Error ? error.message : error
        );
      }

      if (isLastAttempt) {
        console.error(
          `Failed to fetch contract data for ${contract} after ${maxRetries} attempts`
        );
        return {};
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  return {};
}


export async function send(
  amount: string,
  destinationAddress: string,
  tokenAddress?: string
) {
  // Validate amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error(`Invalid amount: ${amount} (must be a positive number)`);
  }
  if (numAmount > 1000000) {
    throw new Error(
      `Amount too large: ${amount}. Please verify this is correct (max: 1,000,000).`
    );
  }

  // Only treat explicit "native" as XLM; otherwise default to USDGLO
  const isNativeXLM = tokenAddress === "native";
  const tokenSymbol = isNativeXLM ? "XLM" : "USDGLO";

  console.log(
    `🚀 Initiating Stellar payout: ${amount} ${tokenSymbol} to ${destinationAddress.slice(0, 4)}...${destinationAddress.slice(-4)}`
  );

  if (!validateStellarAddress(destinationAddress)) {
    throw new Error(
      `Invalid Stellar destination address: ${destinationAddress}`
    );
  }

  // Validate environment variables
  const envValidation = validateStellarEnvironment();
  if (!envValidation.valid) {
    throw new Error(
      `Stellar environment validation failed: ${envValidation.errors.join(", ")}`
    );
  }

  const privateKey = process.env.STELLAR_PAYOUT_PRIVATE_KEY!;
  const keypair = Keypair.fromSecret(privateKey);
  const pubKey = keypair.publicKey();
  console.log(`Using payout address: ${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`);

  const networkPassphrase = Networks.PUBLIC;
  let asset: Asset;
  if (isNativeXLM) {
    asset = Asset.native();
  } else {
    // USDGLO token
    asset = new Asset("USDGLO", GLO_STELLAR);
  }

  // Retry configuration
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Load account fresh on each attempt to get correct sequence number
      const account = await getServer().loadAccount(pubKey);
      console.log(`Account sequence: ${account.sequenceNumber()} (attempt ${attempt}/${maxRetries})`);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: destinationAddress,
            asset,
            amount,
          })
        )
        .setTimeout(180)
        .build();

      transaction.sign(keypair);
      console.log(`Transaction signed, submitting to network...`);

      const sendTransactionResponse = await getServer().submitTransaction(transaction);
      const { hash, successful } = sendTransactionResponse;

      if (successful) {
        console.log(`✅ Stellar ${tokenSymbol} payout successful!`);
        console.log(`Transaction hash: ${hash}`);
        console.log(
          `Explorer: https://stellar.expert/explorer/public/tx/${hash}`
        );
        return { success: true, hash };
      } else {
        // Transaction submitted but failed - don't retry
        console.error(`❌ Transaction failed:`, sendTransactionResponse);
        return { success: false, error: "Transaction was not successful" };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isLastAttempt = attempt === maxRetries;

      // Determine if error is retryable (network issues vs transaction errors)
      const isRetryable =
        err &&
        typeof err === "object" &&
        ("code" in err && err.code === "ECONNABORTED") ||
        (errorMsg.includes("timeout")) ||
        (errorMsg.includes("network"));

      if (isRetryable && !isLastAttempt) {
        console.warn(
          `⚠️ Retryable error on attempt ${attempt}/${maxRetries}: ${errorMsg}`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        continue;
      }

      // Non-retryable error or last attempt - log and return
      console.error(
        `❌ Stellar ${tokenSymbol} payout failed (attempt ${attempt}/${maxRetries}): ${errorMsg}`
      );

      if (err && typeof err === "object") {
        if ("response" in err) {
          const responseData = (err as { response?: { data?: unknown } }).response
            ?.data;
          if (responseData) {
            console.error(
              "Response data:",
              JSON.stringify(responseData, null, 2)
            );
          }
        }
        if ("error" in err) {
          const errorData = (err as { error?: { data?: unknown } }).error?.data;
          if (errorData) {
            console.error("Error data:", JSON.stringify(errorData, null, 2));
          }
        }
      }

      return { success: false, error: errorMsg };
    }
  }

  // Should never reach here, but TypeScript wants a return
  return { success: false, error: "Max retries exceeded" };
}

// Blend pool contract address - configurable via env var
const getBlendContract = () => {
  return (
    process.env.STELLAR_BLEND_CONTRACT ||
    "CCCCIQSDILITHMM7PBSLVDT5MISSY7R26MNZXCX4H7J5JQ5FPIYOGYFS"
  );
};

const getPoolFromContract = async (
  poolContract: string
): Promise<PoolRecord | null> => {
  try {
    const data = await getContractData(poolContract);

    if (!data || Object.keys(data).length === 0) {
      console.warn(`No data found for pool contract ${poolContract}`);
      return null;
    }

    const usdgloBalance = data.USDGLO || data.USD;
    if (!usdgloBalance) {
      console.warn(`No USDGLO found in pool ${poolContract}`);
      return null;
    }

    console.log(`Found Blend pool: USDGLO TVL: $${usdgloBalance}`);

    return {
      token: "USDGLO",
      tvl: twoDecimals(usdgloBalance),
      incentiveTokenTvl: twoDecimals(usdgloBalance),
      participatingTokenTvl: 0,
      dex: "blend",
    };
  } catch (error) {
    console.error(
      `Error fetching pool data for ${poolContract}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
};

export const getStellarPools = async (): Promise<PoolRecord[]> => {
  console.log("🔍 Fetching Blend USDGLO pool data...");

  try {
    const pool = await getPoolFromContract(getBlendContract());

    if (!pool) {
      console.warn("No Blend pool data available");
      return [];
    }

    console.log(`📊 Blend USDGLO TVL: $${pool.tvl}`);
    return [pool];
  } catch (error) {
    console.error(
      "Error fetching Blend pool data:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
};

export const processStellarPayouts = async (payouts: Payout[]) => {
  let [total, completed] = [payouts.length, 0];

  console.log(`🌟 Processing ${total} Stellar payouts...`);

  for (const payout of payouts) {
    if (payout.processed) {
      console.log(`Payout ${payout.id} already processed.`);
      total -= 1;
      continue;
    }

    if (payout.isProcessing) {
      console.log(`Payout ${payout.id} is being processed.`);
      continue;
    }

    console.log(`Processing Stellar payout ${payout.id}...`);

    // Validate payout amount before processing
    if (!payout.value || payout.value <= 0 || isNaN(payout.value)) {
      console.error(
        `❌ Payout ${payout.id} has invalid amount: ${payout.value}. Skipping.`
      );
      total -= 1;
      continue;
    }

    await prisma.payout.update({
      where: { id: payout.id },
      data: { isProcessing: true },
    });

    try {
      // Convert amount to string with proper decimals (Stellar uses 7)
      const amount = payout.value.toFixed(7);

      const result = await send(
        amount,
        payout.payoutAddress,
        payout.tokenAddress
      );

      if (result.success && result.hash) {
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            processed: true,
            isProcessing: false,
            hash: result.hash,
            processedAt: new Date(),
          },
        });

        console.log(`✅ Stellar payout ${payout.id} completed: ${result.hash}`);
        completed++;
      } else {
        console.error(`❌ Stellar payout ${payout.id} failed: ${result.error}`);
        await prisma.payout.update({
          where: { id: payout.id },
          data: { isProcessing: false },
        });
      }
    } catch (error) {
      console.error(`❌ Stellar payout ${payout.id} error:`, error);
      await prisma.payout.update({
        where: { id: payout.id },
        data: { isProcessing: false },
      });
    }
  }

  let txt = `${completed}/${total} Stellar payouts completed.`;
  if (completed !== total) {
    txt += " Issues detected! <!here>";
  }
  console.log(txt);
  await postSlack(txt);
};
