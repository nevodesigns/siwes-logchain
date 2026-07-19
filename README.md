# SIWES LogChain

A tamper-proof onchain logbook for SIWES (Students Industrial Work Experience Scheme), built on Monad Testnet.

Students submit daily log entries as keccak256 hashes, supervisors approve them onchain, and institutions can verify any student's complete training record publicly, without an account or a wallet.

**Live app:** https://siwes-logchain.pxxl.run

## The problem

Every Nigerian engineering and science student goes through SIWES industrial training with a paper logbook. Those logbooks get lost, pages get disputed, and entries get backdated the night before submission. When an institution wants to confirm that a student actually did the work, there is nothing to check against.

## The solution

- The student writes their daily log in the browser. The raw text never leaves their machine, only the keccak256 hash of it goes onchain, timestamped by the block.
- Their assigned supervisor approves each entry from their own wallet. An approval is a permanent onchain attestation that cannot be revoked or edited.
- Anyone with the student's wallet address can pull up the full record on the verify page and confirm every entry, its timestamp, and its approval status. Records cannot be backdated, edited, or lost.

## Try it now

Open the verify page with a seeded demo record:

https://siwes-logchain.pxxl.run/?address=0x8F6D39D6ff1abb8DECAFf3ba5FCEC4eD213c437d

No wallet, no account. The record loads directly from the Monad blockchain.

## Contract

| | |
|---|---|
| Network | Monad Testnet (chain ID 10143) |
| Contract | `0x41b276b87264f9a58cAae09163d91e88F731A78B` |
| Explorer | [testnet.monadexplorer.com](https://testnet.monadexplorer.com/address/0x41b276b87264f9a58cAae09163d91e88F731A78B) |
| MonadVision | [testnet.monadvision.com](https://testnet.monadvision.com/address/0x41b276b87264f9a58cAae09163d91e88F731A78B) |
| Monadscan | [testnet.monadscan.com](https://testnet.monadscan.com/address/0x41b276b87264f9a58cAae09163d91e88F731A78B) |
| Source | [contracts/SIWESLog.sol](contracts/SIWESLog.sol) |

The contract is verified on MonadVision and Monadscan via the Monskills verification API.

## How it works

Three views:

1. **Verify** (`/`) is the institution-facing page. Paste a student wallet address and get their full record rendered like an official certificate: profile, entry timeline, hashes, and approval status. Works read-only, no wallet needed. Records are shareable as links via `/?address=0x...`
2. **Student** (`/student`) is where students register (name, matric number, institution, supervisor wallet) and submit daily entries. The entry text is hashed with keccak256 in the browser before submission.
3. **Supervisor** (`/supervisor`) lists every student assigned to the connected wallet with their pending entries, each with a one-click onchain approve.

Every transaction links out to the Monad testnet explorer.

## Running locally

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The deployed contract address, chain config, and ABI live in [frontend/src/constants.js](frontend/src/constants.js).

To interact with the app you need MetaMask with the Monad Testnet network. The app offers to add and switch to it automatically on connect (RPC `https://testnet-rpc.monad.xyz`, chain ID 10143, symbol MON). Get testnet MON from a Monad faucet.

Contract deployment (already done, only needed for a redeploy):

```bash
npm install
PRIVATE_KEY=<deployer key> npx hardhat run scripts/deploy.js --network monadTestnet
```

## Deploying to Pxxl

1. Create a new project at [pxxl.app](https://pxxl.app) and connect the repo
2. In Additional Build Settings, set:
   - **Root Directory:** `frontend`
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Start Command:** `npx serve -s dist -l $PORT`
3. Deploy. No environment variables are needed, the contract address ships in `constants.js`

The `-s` flag on serve handles SPA routing so `/student` and `/supervisor` resolve correctly on direct load.

## Stack

- Solidity 0.8.20, Hardhat, Monad Testnet
- React + Vite, ethers.js v6, react-router
- Plain CSS with variables, JetBrains Mono + Inter

## Why Monad

400ms block times and 800ms finality mean a log entry or an approval confirms about as fast as the UI can show it, which matters when a supervisor is approving a whole week of entries in one sitting. Full EVM compatibility means the standard Solidity + ethers toolchain works unchanged. One thing to know as a developer: Monad charges gas on the gas limit rather than gas used, so the frontend estimates gas per transaction and adds only a 10 percent buffer instead of letting the wallet pick a padded default.

## Open source

This project is MIT licensed. Contributions are welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

The contract is deployed and verified. If you want to build a different
frontend or integrate SIWES LogChain into your institution's systems,
the ABI is in [frontend/src/constants.js](frontend/src/constants.js).

## Roadmap

Features planned for future versions:

- Bulk supervisor import (institutions onboard all students at once)
- NYSC integration (same system, different training body)
- Institution dashboard (verify all students from one wallet)
- Mobile app (React Native)
- Support for other Nigerian training programmes