const { ethers } = require("hardhat");
const { Wallet } = require("ethers");
const deployments = require("../deployments.json");

const NETWORK = process.env.NETWORK || "lisk";
const MELODYNE_VERSION = process.env.MELODYNE_VERSION || "V1";
const MELODYNE_ADDRESS = deployments[NETWORK][`Melodyne${MELODYNE_VERSION}`];


// To test the interactions use
// npx hardhat run scripts/melodyneInteractions.js --network lisk-sepolia
async function main() {
  const campaignId = 0;
  const USDC_ADDRESS = "0x3ba742FD7502a6395D234e024A64c78705496dfE"; // Mock USDC
  const donor1 = new Wallet("9e5f4c8fb95d93cde24a23d09a1d98b5f42b25ef191fa1fe157cd1edc13340d5", ethers.provider);

  const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const melodyne = await ethers.getContractAt("Melodyne", MELODYNE_ADDRESS);
  const eth50 = ethers.utils.parseUnits("50", 6)
  const eth100 = ethers.utils.parseUnits("100", 6)
  const eth150 = ethers.utils.parseUnits("150", 6)

  const goal = eth100;
  const cap = eth150;
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const deadline = now + 4600;


  /************  Approving Spending  ************/
  console.log("Approving Melodyne contract...");
  const approveTx = await usdc.connect(donor1).approve(melodyne.address, cap);
  await approveTx.wait();
  console.log("USDC Balance:", (await usdc.balanceOf(donor1.address)).toString());
  console.log("Allowance:", (await usdc.allowance(donor1.address, melodyne.address)).toString());


  /********  Creating Campaign  ***********/
  console.log("Creating campaign...");
  const txCampaign = await melodyne.createCampaign(goal, cap, deadline, {
    gasLimit: 1_000_000
  });
  await txCampaign.wait();


  /***********  Adding Tier  **************/
  console.log("Adding tier...");
  const tierAmount = eth50;
  const txTier = await melodyne.addTier(campaignId, tierAmount, {
    gasLimit: 1_000_000
  });
  await txTier.wait();


  /*******  Publishing campaign  **********/
  console.log("Publishing campaign...");
  const txPublish = await melodyne.publishCampaign(campaignId);
  await txPublish.wait();


  /************  Contributing   ************/
  console.log("Contributing to campaign 1 ...");
  const contributeTx1 = await melodyne.connect(donor1).contribute(campaignId, 0, {
    gasLimit: 1_000_000
  });
  await contributeTx1.wait();

  console.log("Contributing to campaign 2 ...");
  const contributeTx2 = await melodyne.connect(donor1).contribute(campaignId, 0, {
    gasLimit: 1_000_000
  });
  await contributeTx2.wait();



  /************  Get Campaign   ************/
  campaign = await melodyne.getCampaign(campaignId);
  console.log("Total contributed:", ethers.utils.formatUnits(campaign.totalContributed, 6));
  console.log("Current status:", campaign.status);



  /************  Finalize   ************/
  if (campaign.status.toString() === "2") {
    console.log("Campaign successful. Withdrawing funds...");
    const withdrawTx = await melodyne.withdraw(campaignId, {
      gasLimit: 1_000_000
    });
    await withdrawTx.wait();
  } else if (campaign.status.toString() === "3") {
    console.log("Campaign failed. Issuing refund...");
    const refundTx = await melodyne.connect(donor1).refund(campaignId);
    await refundTx.wait();
  } else {
    console.log("Campaign still active or status unknown.");
  }
  console.log("✅ Script complete");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});