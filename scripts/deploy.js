const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const SIWESLog = await hre.ethers.getContractFactory("SIWESLog");

  // Monad charges gas on the limit, not usage - use the estimate with a
  // small buffer instead of letting the node pick a padded default
  const deployTx = await SIWESLog.getDeployTransaction();
  const estimate = await deployer.estimateGas(deployTx);
  const gasLimit = estimate + estimate / 10n;
  console.log("Gas estimate:", estimate.toString(), "-> limit:", gasLimit.toString());

  const contract = await SIWESLog.deploy({ gasLimit });
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SIWESLog deployed to:", address);
  console.log("Explorer:", `https://testnet.monadexplorer.com/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
