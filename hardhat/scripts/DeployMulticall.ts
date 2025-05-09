const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Multicall with", deployer.address);

  const Multicall = await ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();
  await multicall.deployed();

  console.log("Multicall deployed at:", multicall.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
