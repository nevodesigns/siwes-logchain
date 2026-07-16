Project: SIWES LogChain — Monad Hackathon (deadline July 19 11:59 PM UTC)

I am a Nigerian Software Engineering student currently on SIWES industrial
placement. I am building an onchain logbook for SIWES (industrial training)
where students submit daily log hashes, supervisors approve them onchain, and
institutions can verify the chain publicly. This solves a real personal problem:
paper logbooks get lost, disputed, and backdated.

--- SMART CONTRACT ---
The contract is already written at ./contracts/SIWESLog.sol
Do NOT rewrite it. Deploy it as-is.

Network: Monad Testnet
RPC: https://testnet-rpc.monad.xyz
Chain ID: 10143
Symbol: MON
Block Explorer: https://testnet.monadexplorer.com

Deploy with Hardhat. Verify the contract on the explorer after deploying.
Save the deployed contract address to a .env file and to a constants.js file
the frontend can import.

--- TECH STACK ---
- Smart contract: Solidity 0.8.20, Hardhat
- Frontend: React + Vite
- Wallet: ethers.js v6 (NOT wagmi, NOT RainbowKit — keep it simple)
- Styling: plain CSS with CSS variables — NO Tailwind, NO component libraries
- Hosting: the app will be deployed to Vercel

--- THREE FRONTEND VIEWS ---

1. STUDENT VIEW (/student)
   - Connect MetaMask wallet
   - If not registered: show registration form (name, matric number, institution,
     supervisor wallet address) — calls register() on contract
   - If registered: show a text area to write today's log entry + a week/day label
     input (e.g. "Week 3, Day 2"). Hash the text with ethers.keccak256 in the
     browser. Call submitEntry(hash, label). Show list of all past entries with
     their approval status (green checkmark = approved, orange = pending).

2. SUPERVISOR VIEW (/supervisor)
   - Connect MetaMask wallet
   - Fetch list of students assigned to this supervisor via getSupervisorStudents()
   - For each student: show their name, matric, and all pending (unapproved) entries
   - Each pending entry has an "Approve" button that calls approveEntry(student, idx)
   - Show confirmation of tx hash after approval

3. VERIFY VIEW / (home page)
   - No wallet needed
   - Input: paste any student wallet address
   - Fetches their profile (name, matric, institution) and all log entries
   - Display a timeline of entries: date, week label, hash (truncated), approved/pending
   - This is the institution-facing page. Make it look like a certificate or official record.

--- DESIGN REQUIREMENTS ---
This is a hackathon. The UI must look unique — not like a generic React app.
Brand: dark background (#0D0D0D), accent color neon green (#ADFF2F),
monospace font (JetBrains Mono or Space Mono from Google Fonts) for hashes
and technical data, a clean sans-serif (Inter) for body text.
Every view must fit in the viewport without scrolling on desktop.
Mobile must not break the layout.
The header should show "SIWES LogChain" with a small chain icon.
No gradients, no animations, no decorative noise. Clean, minimal, technical.

--- BUILD ORDER ---
1. Set up Hardhat, configure Monad testnet in hardhat.config.js
2. Deploy SIWESLog.sol, save contract address
3. Set up React + Vite project in ./frontend/
4. Build the Verify view first (no wallet needed, easiest to test)
5. Build Student view
6. Build Supervisor view
7. Add a README.md with: project description, problem, solution, how to run,
   contract address, Monad explorer link
8. Set up Vercel deployment

--- IMPORTANT RULES ---
- Never use em dashes anywhere in UI text, README, or any content
- Keep the contract unchanged — do not add functions or modify it
- Every transaction should show a link to the Monad testnet explorer
- The verify page must work without MetaMask (read-only calls)
- Commit after each major step so git history is clean
