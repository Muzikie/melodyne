const { ethers } = require("hardhat");
const deployments = require("../deploy-config.json");

const NETWORK = process.env.NETWORK || "lisk";
const CONFIG_ADDRESS = deployments[NETWORK].MelodyneConfig;

// To test the interactions use
// npx hardhat run scripts/MelodyneConfigInteractions.js --network lisk-sepolia
async function main() {
  const [deployer] = await ethers.getSigners();
  const ONE_HOUR = 60 * 60; // 1 hour


  /************  Deploy Config  **************/
  console.log("Deploying with:", deployer.address);
  // const MelodyneConfig = await ethers.getContractFactory("MelodyneConfig");
  // const config = await MelodyneConfig.deploy();
  // await config.wait();
  // const address = await config.getAddress();
  // console.log("✅ MelodyneConfig deployed to:", address);


  /************  Use Existing Config  **************/
  console.log("Connect with address:", CONFIG_ADDRESS);
  const MelodyneConfig = await ethers.getContractFactory("MelodyneConfig");
  const config = MelodyneConfig.attach(CONFIG_ADDRESS);


  console.log("Set Fee BpS");
  const tx1 = await config.setPlatformFeeBps(500); // 5%
  await tx1.wait();


  console.log("Set Fee Recipient");
  const tx2 = await config.setFeeRecipient("0x808646080c7e494272CC8B3a1D02937E29E95B5A");
  await tx2.wait();


  console.log("Set Min and Max ranges");
  const tx3 = await config.setCampaignDurations(ONE_HOUR, ONE_HOUR * 24 * 30); // 1 hour, 30 days
  await tx3.wait();


  console.log("Set Max active campaigns");
  const tx4 = await config.setMaxActiveCampaignsPerUser(2);
  await tx4.wait();


  console.log("Set Campaign creation fee");
  const eth1 = ethers.utils.parseUnits("0", 6)
  const tx5 = await config.setCampaignCreationFee(eth1); // 1 USDC (6 decimals)
  await tx5.wait();

  console.log("Double checking the configs")
  const feeBps = await config.platformFeeBps();
  const feeRecipient = await config.feeRecipient();
  const minDuration = await config.minCampaignDuration();
  const maxDuration = await config.maxCampaignDuration();
  const creationFee = await config.campaignCreationFee();

  console.log("🧾 Current MelodyneConfig:");
  console.log("• Platform Fee (bps):", feeBps.toString());
  console.log("• Fee Recipient:", feeRecipient);
  console.log("• Min Duration (s):", minDuration.toNumber());
  console.log("• Max Duration (s):", maxDuration.toNumber());
  console.log("• Campaign Creation Fee:", creationFee.toString());

  console.log("🧩 Configuration complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});