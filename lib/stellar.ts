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
    if (!address || !token || !issuer || !validateStellarAddress(address)) {
      return 0;
    }

    const account = await getServer().loadAccount(address);
    const tokenBalance = account.balances.find(
      (bal) =>
        (bal.asset_type === "credit_alphanum4" ||
          bal.asset_type === "credit_alphanum12") &&
        bal.asset_code === token &&
        bal.asset_issuer === issuer
    );

    return tokenBalance ? parseFloat(tokenBalance.balance) : 0;
  } catch {
    return 0;
  }
}

export async function getStellarNativeBalance(
  address: string
): Promise<number> {
  try {
    if (!address || !validateStellarAddress(address)) return 0;

    const account = await getServer().loadAccount(address);
    const nativeBalance = account.balances.find((bal) => bal.asset_type === "native");

    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  } catch {
    return 0;
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

      if (!res.data?.balances) return {};

      const tokens: Dict = res.data.balances.reduce(
        (acc: Dict, cur: { value: number; asset: string }) => {
          if (cur.value && cur.asset) {
            const tokenSymbol = cur.asset.split("-")[0];
            const decimals = getTokenDecimals(tokenSymbol);
            const tokenValue = Number(cur.value) / Math.pow(10, decimals);
            return { ...acc, [tokenSymbol]: tokenValue };
          }
          return acc;
        },
        {}
      );

      return tokens;
    } catch (error: unknown) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        console.error(`❌ Stellar pool (blend/USDGLO) fetch failed: ${error instanceof Error ? error.message : String(error)}`);
        return {};
      }
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

      console.log("Submitting Stellar transaction...");
      const sendTransactionResponse = await getServer().submitTransaction(transaction);
      const { hash, successful } = sendTransactionResponse;

      if (successful) {
        console.log(`Stellar transaction confirmed: ${hash}`);
        return { success: true, hash };
      } else {
        console.error("Stellar transaction was not successful");
        return { success: false, error: "Transaction was not successful" };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isLastAttempt = attempt === maxRetries;

      // Extract detailed Horizon error if available
      let detailedError = errorMsg;
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as Record<string, unknown>).response;
        if (response && typeof response === "object" && "data" in response) {
          detailedError = JSON.stringify(response.data, null, 2);
          console.error(`Stellar transaction error (attempt ${attempt}/${maxRetries}):`, detailedError);
        }
      } else {
        console.error(`Stellar transaction error (attempt ${attempt}/${maxRetries}):`, errorMsg);
      }

      // Determine if error is retryable (network issues vs transaction errors)
      const isRetryable =
        err &&
        typeof err === "object" &&
        ("code" in err && err.code === "ECONNABORTED") ||
        (errorMsg.includes("timeout")) ||
        (errorMsg.includes("network"));

      if (isRetryable && !isLastAttempt) {
        console.log(`Retrying Stellar transaction in ${retryDelay * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        continue;
      }

      return { success: false, error: detailedError };
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
  const data = await getContractData(poolContract);
  if (!data || Object.keys(data).length === 0) return null;

  const usdgloBalance = data.USDGLO || data.USD;
  if (!usdgloBalance) return null;

  return {
    token: "USDGLO",
    tvl: twoDecimals(usdgloBalance),
    incentiveTokenTvl: twoDecimals(usdgloBalance),
    participatingTokenTvl: 0,
    dex: "blend",
  };
};

export const getStellarPools = async (): Promise<PoolRecord[]> => {
  const pool = await getPoolFromContract(getBlendContract());
  return pool ? [pool] : [];
};

export const processStellarPayouts = async (payouts: Payout[]) => {
  let [total, completed] = [payouts.length, 0];

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

    // Validate payout amount before processing
    if (!payout.value || payout.value <= 0 || isNaN(payout.value)) {
      console.error(`Payout ${payout.id} has invalid amount: ${payout.value}`);
      total -= 1;
      continue;
    }

    console.log(`Processing payout ${payout.id}...`);

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
        console.log(`Payout ${payout.id} completed.`);
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            processed: true,
            isProcessing: false,
            hash: result.hash,
            processedAt: new Date(),
          },
        });

        completed++;
      } else {
        console.error(`Failed to process payout ${payout.id}:`, result.error);
        await prisma.payout.update({
          where: { id: payout.id },
          data: { isProcessing: false },
        });
      }
    } catch (err) {
      console.error(`Payout ${payout.id} exception:`, err);
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
  await postSlack(txt);
};
