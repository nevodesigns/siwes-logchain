# SIWES LogChain: QA and Security Audit Brief

## What was built

SIWES LogChain is a tamper-proof onchain logbook for Nigerian industrial
training (SIWES), built on Monad Testnet. The full app was built and deployed
in one session using Claude Code with Monskills.

## Current deployment state

- Live app: https://siwes-logchain.pxxl.run
- GitHub: https://github.com/nevodesigns/siwes-logchain
- Platform: Pxxl (Node 26, Vite static build, root dir: frontend)
- Contract: 0x41b276b87264f9a58cAae09163d91e88F731A78B
- Network: Monad Testnet (chain ID 10143)
- Contract verified on MonadVision and Monadscan

## What was tested manually (all passing)

- Verify page (/) reads student record from chain without wallet
- Student page (/student) connects MetaMask, registers student onchain,
  submits log entry (keccak256 hashed in browser), shows tx confirmation
- Supervisor page (/supervisor) shows assigned students, pending entries,
  one-click onchain approval
- Full cycle tested: register, submit entry, approve entry, verify record

## Stack

- Smart contract: Solidity 0.8.20, Hardhat
- Frontend: React + Vite, ethers.js v6, react-router-dom
- Styling: plain CSS with CSS variables, no component library
- Fonts: Inter + JetBrains Mono from Google Fonts

## Your task: Full QA and Security Audit

This app was built fast for a hackathon. Do a thorough QA and security
review before the July 19 deadline. The owner cannot afford to have a
working submission broken or exploited.

### 1. Smart contract security audit

Read contracts/SIWESLog.sol carefully and check for:

- Reentrancy vulnerabilities on any state-changing functions
- Access control: confirm only the assigned supervisor can approve entries
  for their students. No other address should be able to call approveEntry
  for a student they are not assigned to.
- Integer overflow or underflow risks (Solidity 0.8.20 has built-in
  overflow protection but verify it applies everywhere)
- Denial of service: can a malicious actor spam the contract to make it
  unusable for legitimate users? Check unbounded loops or storage growth.
- Front-running risks: can someone watch the mempool and front-run a
  registration or approval?
- Self-registration as supervisor: can a student set themselves as their
  own supervisor and approve their own entries? If so, is that a problem
  for the use case? Flag it clearly.
- Any function that should be restricted but is not
- Events: confirm all state changes emit events so the frontend can react
- Check that the contract has no selfdestruct, no owner with elevated
  privileges that could rug the data, and no upgradability (it should be
  immutable by design)

### 2. Frontend security audit

Read all files in frontend/src/ and check for:

- Private key exposure: confirm no private keys, mnemonics, or secrets
  are anywhere in the frontend code or committed to the repo
- Environment variables: confirm .env is in .gitignore and not committed.
  Check git log to make sure it was never accidentally committed in any
  earlier commit.
- XSS (cross-site scripting): check all places where user input or
  contract data is rendered. Confirm React's JSX escaping is not bypassed
  with dangerouslySetInnerHTML or similar.
- The keccak256 hashing happens client-side in the browser before
  submission. Confirm the raw log text is never sent to any server or
  external endpoint.
- localStorage usage: the app stores raw log text in localStorage keyed
  by hash. Confirm this is clearly communicated to users (the text only
  exists on the device that submitted it) and that no sensitive data
  beyond the log text is stored there.
- RPC calls: confirm all read calls go to https://testnet-rpc.monad.xyz
  and no user data is leaked to third-party services
- Wallet address handling: confirm no wallet addresses are logged to
  console in production
- Dependencies: run npm audit in the frontend folder and report any
  high or critical vulnerabilities. Fix anything critical.
- Check that the MetaMask connection request does not ask for more
  permissions than necessary

### 3. Functional QA

Test every user flow end to end on the live URL
(https://siwes-logchain.pxxl.run) using the seeded demo data and report
any bugs:

- Verify page: paste 0x8F6D39D6ff1abb8DECAFf3ba5FCEC4eD213c437d and
  confirm the record loads, shows 3 entries, 2 approved and 1 pending
- Verify page: paste an address not registered on the contract and
  confirm the error state is handled gracefully (no crash, clear message)
- Verify page: paste a malformed address (e.g. "hello") and confirm it
  does not crash
- Student page: confirm the page does not crash if MetaMask is not
  installed (should show an install prompt)
- Student page: confirm that after registration the form disappears and
  the entry submission UI appears
- Student page: confirm the week/day label field cannot be submitted
  empty
- Student page: confirm the log entry textarea cannot be submitted empty
- Supervisor page: confirm that if the connected wallet has no assigned
  students, it shows a clear empty state message (not a crash or blank)
- All pages: confirm no console errors on load
- All pages: check mobile layout at 375px width for any overflow or
  broken elements

### 4. Fix priority

After the audit, fix issues in this order:

1. Critical security issues (anything that could expose user data or
   allow unauthorised contract calls)
2. Functional bugs that would cause a crash during the demo video
3. UX issues that would confuse a judge seeing the app for the first time
4. Low severity issues (console warnings, minor layout issues)

Do not change the visual design or remove any features. Only fix
what is broken or insecure.

### 5. After fixes

- Run npm audit fix in the frontend folder
- Run the Hardhat compile to confirm the contract still compiles cleanly
- Commit all fixes with clear messages explaining what was fixed and why
- Push to GitHub
- Confirm the Pxxl deployment auto-updates from the push (it should,
  since it is connected to the main branch)

Report your findings clearly: what you found, what you fixed, and what
(if anything) you could not fix and why.
