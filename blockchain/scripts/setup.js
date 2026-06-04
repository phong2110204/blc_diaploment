const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔧 Setting up DiplomaManager contract...");

  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("./deployment.json", "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("📍 Contract address:", contractAddress);

  // Get deployer account (admin)
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Admin account:", deployer.address);

  // Get contract instance
  const DiplomaManager = await hre.ethers.getContractFactory("DiplomaManager");
  const contract = DiplomaManager.attach(contractAddress);

  // Add deployer as issuer
  console.log("\n➕ Adding issuer...");
  const txIssuer = await contract.addIssuer(deployer.address);
  await txIssuer.wait();
  console.log("✅ Issuer added successfully!");

  // Add deployer as verifier
  console.log("\n➕ Adding verifier...");
  const txVerifier = await contract.addVerifier(deployer.address);
  await txVerifier.wait();
  console.log("✅ Verifier added successfully!");

  console.log("\n🎉 Setup complete!");
  console.log("📝 Account", deployer.address, "is now an issuer and verifier");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
