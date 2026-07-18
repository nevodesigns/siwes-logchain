# Contributing to SIWES LogChain

Thanks for wanting to help. This project exists so Nigerian students never lose a training record again, and every contribution moves that along.

## Running the project locally

The frontend is a plain React + Vite app:

```bash
cd frontend
npm install
npm run dev
```

That is all you need for most contributions. The app talks to the deployed contract on Monad Testnet, so records you see locally are the real onchain records.

To interact as a student or supervisor you need MetaMask with the Monad Testnet network (the app offers to add it on connect) and some testnet MON. Get testnet MON from the official faucet at https://faucet.monad.xyz or any faucet listed in the Monad docs.

## Working on the contract

The contract at [contracts/SIWESLog.sol](contracts/SIWESLog.sol) is deployed and verified at `0x41b276b87264f9a58cAae09163d91e88F731A78B` on Monad Testnet. It is immutable by design and should not be redeployed unless a breaking bug is found. Institutions rely on records at this address, and a redeploy orphans them.

For contract experiments, run a local Hardhat node from the project root:

```bash
npm install
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Then point `frontend/src/constants.js` at your local address and RPC while testing. Never commit that change.

## Branches

- `feature/your-feature-name` for new features
- `fix/your-fix-name` for bug fixes

## Commit messages

Human, descriptive, lowercase. Write what you did the way you would say it to a teammate:

- good: `qr code scans straight to the verify page`
- bad: `feat: Add QRCode component`

## Pull request requirements

- `npm run build` must pass clean in `frontend/`
- No console errors on any page
- No em dashes in any user-facing text, use commas or restructure the sentence
- Labels and UI copy in sentence case
- Every transaction the UI sends must link to https://testnet.monadexplorer.com
- Do not add TypeScript, Tailwind, or component libraries, the stack is plain JavaScript and plain CSS on purpose

## Questions

Open an issue. If you are a student or supervisor using the app and something feels wrong or confusing, that is a bug report too, and a valuable one.
