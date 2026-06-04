const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DiplomaManager contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy contract
  const DiplomaManager = await hre.ethers.getContractFactory("DiplomaManager");
  const contract = await DiplomaManager.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);

  // Save contract address
  const fs = require("fs");
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    network: hre.network.name,
    chainId: Number(network.chainId)
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to deployment.json");
  console.log("\n📌 Next steps:");
  console.log("1. Copy contract address to backend .env (CONTRACT_ADDRESS)");
  console.log("2. Copy contract address to frontend .env (REACT_APP_CONTRACT_ADDRESS)");
  console.log("3. Run backend: npm run dev");
  console.log("4. Run frontend: npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
