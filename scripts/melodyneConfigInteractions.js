const { ethers } = require("hardhat");

// To test the interactions use
// npx hardhat run scripts/MelodyneConfigInteractions.js --network lisk-sepolia
async function main() {
  const [deployer] = await ethers.getSigners();
  const ONE_MIN = 60;


  /************  Deploy Config  **************/
  // console.log("Deploying with:", deployer.address);
  // const MelodyneConfig = await ethers.getContractFactory("MelodyneConfig");
  // const config = await MelodyneConfig.deploy();
  // await config.wait();
  // const address = await config.getAddress();
  // console.log("✅ MelodyneConfig deployed to:", address);


  /************  Use Existing Config  **************/
  const configAddress = "0x931dDf48fBa04054E49b1BF01977DDa887404Dfa";
  console.log("Connect with address:", configAddress);
  const MelodyneConfig = await ethers.getContractFactory("MelodyneConfig");
  const config = MelodyneConfig.attach(configAddress);


  console.log("Set Fee BpS");
  const tx1 = await config.setPlatformFeeBps(500); // 5%
  await tx1.wait();


  console.log("Set Fee Recipient");
  const tx2 = await config.setFeeRecipient(deployer.address);
  await tx2.wait();


  console.log("Set Min and Max ranges");
  const tx3 = await config.setCampaignDurations(ONE_MIN, ONE_MIN * 60 * 24 * 10); // 1 min, 10 days
  await tx3.wait();


  console.log("Set Max active campaigns");
  const tx4 = await config.setMaxActiveCampaignsPerUser(2);
  await tx4.wait();


  console.log("Set Campaign creation fee");
  const eth1 = ethers.utils.parseUnits("1", 6)
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
  console.log("• Min Duration (s):", minDuration.toString());
  console.log("• Max Duration (s):", maxDuration.toString());
  console.log("• Campaign Creation Fee:", creationFee.toString());

  console.log("🧩 Configuration complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});