import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CHAIN_ID,
  CHAIN_ID_HEX,
  RPC_URL,
  EXPLORER_URL,
} from "../constants";

let readProvider;

// Read-only contract, works without MetaMask (verify page relies on this)
export function getReadContract() {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(RPC_URL, CHAIN_ID);
  }
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
}

async function ensureMonadTestnet() {
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (parseInt(current, 16) === CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err) {
    // 4902 = chain not added to the wallet yet
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "Monad Testnet",
            nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [EXPLORER_URL],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Install it and reload this page.");
  }
  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureMonadTestnet();
  const provider = new BrowserProvider(window.ethereum);
  return provider.getSigner();
}

export function getWriteContract(signer) {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// Monad charges gas on the limit, not on usage, so a padded wallet default
// costs the user real MON. Estimate and add a 10% buffer, nothing more.
export async function sendWithTightGas(contract, method, args) {
  const estimate = await contract[method].estimateGas(...args);
  const gasLimit = estimate + estimate / 10n;
  return contract[method](...args, { gasLimit });
}

export const explorerTx = (hash) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (addr) => `${EXPLORER_URL}/address/${addr}`;
export const shortHash = (h) => `${h.slice(0, 10)}...${h.slice(-8)}`;
export const shortAddress = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;
export const formatDate = (ts) =>
  new Date(Number(ts) * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
