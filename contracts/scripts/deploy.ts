import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Network:", network.name);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // Deploy SocialProfile
  console.log("\nDeploying SocialProfile...");
  const SocialProfile = await ethers.getContractFactory("SocialProfile");
  const socialProfile = await SocialProfile.deploy();
  await socialProfile.waitForDeployment();
  const profileAddress = await socialProfile.getAddress();
  console.log("SocialProfile deployed to:", profileAddress);

  // Deploy SocialPost (depends on SocialProfile)
  console.log("\nDeploying SocialPost...");
  const SocialPost = await ethers.getContractFactory("SocialPost");
  const socialPost = await SocialPost.deploy(profileAddress);
  await socialPost.waitForDeployment();
  const postAddress = await socialPost.getAddress();
  console.log("SocialPost deployed to:", postAddress);

  // Save deployment addresses for frontend and subgraph
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    contracts: {
      SocialProfile: profileAddress,
      SocialPost: postAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment saved to: ${outputPath}`);

  // Copy ABIs for frontend
  await copyAbisForFrontend(profileAddress, postAddress);

  console.log("\nDeployment complete!");
  console.log("SocialProfile:", profileAddress);
  console.log("SocialPost:", postAddress);
}

async function copyAbisForFrontend(profileAddress: string, postAddress: string) {
  const frontendAbisDir = path.join(__dirname, "../../app/src/lib/abis");
  if (!fs.existsSync(frontendAbisDir)) {
    fs.mkdirSync(frontendAbisDir, { recursive: true });
  }

  const profileArtifact = await import("../artifacts/contracts/SocialProfile.sol/SocialProfile.json");
  const postArtifact = await import("../artifacts/contracts/SocialPost.sol/SocialPost.json");

  fs.writeFileSync(
    path.join(frontendAbisDir, "SocialProfile.json"),
    JSON.stringify(profileArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendAbisDir, "SocialPost.json"),
    JSON.stringify(postArtifact.abi, null, 2)
  );

  console.log("ABIs copied to frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
