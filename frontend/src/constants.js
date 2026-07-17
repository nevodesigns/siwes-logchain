// Deployed SIWESLog contract on Monad Testnet
export const CONTRACT_ADDRESS = "0x41b276b87264f9a58cAae09163d91e88F731A78B";
export const CHAIN_ID = 10143;
export const CHAIN_ID_HEX = "0x279f";
export const RPC_URL = "https://testnet-rpc.monad.xyz";
export const EXPLORER_URL = "https://testnet.monadexplorer.com";

export const CONTRACT_ABI = [
  "function register(string name, string matricNumber, string institution, address supervisor)",
  "function submitEntry(bytes32 contentHash, string weekLabel)",
  "function approveEntry(address student, uint256 entryIndex)",
  "function students(address) view returns (string name, string matricNumber, string institution, address supervisor, bool registered)",
  "function getEntries(address student) view returns (tuple(bytes32 contentHash, uint256 timestamp, bool approved, uint256 approvedAt, string weekLabel)[])",
  "function getEntryCount(address student) view returns (uint256)",
  "function getSupervisorStudents(address supervisor) view returns (address[])",
  "function verifyEntry(address student, uint256 entryIndex) view returns (bytes32 contentHash, uint256 submittedAt, bool approved, uint256 approvedAt)",
];
