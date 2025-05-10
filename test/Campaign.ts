import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("CampaignManager", function () {
  let campaign: Contract;
  let owner: Signer, user1: Signer, user2: Signer;
  let ownerAddress: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();

    const CampaignManager = await ethers.getContractFactory("CampaignManager");
    campaign = await CampaignManager.connect(owner).deploy();
    await campaign.deployed();
  });

  it("should create a campaign in draft", async () => {
    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), Math.floor(Date.now() / 1000) + 86400);
    const result = await campaign.getCampaign(0);
    expect(result.owner).to.equal(ownerAddress);
    expect(result.status).to.equal(0); // Draft
  });

  it("should allow tier addition and publishing", async () => {
    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), Math.floor(Date.now() / 1000) + 86400);
    await campaign.addTier(0, ethers.utils.parseEther("0.5"));
    await campaign.publishCampaign(0);
    const result = await campaign.getCampaign(0);
    expect(result.status).to.equal(1); // Published
  });

  it("should allow contributions and update to SoldOut", async () => {
    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("1"), Math.floor(Date.now() / 1000) + 86400);
    await campaign.addTier(0, ethers.utils.parseEther("1"));
    await campaign.publishCampaign(0);

    await campaign.connect(user1).contribute(0, 0, { value: ethers.utils.parseEther("1") });

    const result = await campaign.getCampaign(0);
    expect(result.totalContributed).to.equal(ethers.utils.parseEther("1"));
    expect(result.status).to.equal(4); // SoldOut
  });

  it("should prevent contributions past hard cap", async () => {
    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("1"), Math.floor(Date.now() / 1000) + 86400);
    await campaign.addTier(0, ethers.utils.parseEther("1"));
    await campaign.publishCampaign(0);

    await campaign.connect(user1).contribute(0, 0, { value: ethers.utils.parseEther("1") });

    await expect(
      campaign.connect(user2).contribute(0, 0, { value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Already sold out");
  });

  it("should allow refund after failure", async () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + 2; // 2 seconds from now

    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), deadline);
    await campaign.addTier(0, ethers.utils.parseEther("0.5"));
    await campaign.publishCampaign(0);

    await campaign.connect(user1).contribute(0, 0, { value: ethers.utils.parseEther("0.5") });

    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait until deadline passes

    await campaign.connect(user1).refund(0);

    const result = await campaign.getCampaign(0);
    expect(result.status).to.equal(3); // Failed
  });

  it("should not allow refund before deadline", async () => {
    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), Math.floor(Date.now() / 1000) + 86400);
    await campaign.addTier(0, ethers.utils.parseEther("0.5"));
    await campaign.publishCampaign(0);

    await campaign.connect(user1).contribute(0, 0, { value: ethers.utils.parseEther("0.5") });

    await expect(
      campaign.connect(user1).refund(0)
    ).to.be.revertedWith("Not refundable");
  });

  it("should allow owner to withdraw if successful", async () => {
    await campaign.createCampaign(ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), Math.floor(Date.now() / 1000) + 2);
    await campaign.addTier(0, ethers.utils.parseEther("1"));
    await campaign.publishCampaign(0);

    await campaign.connect(user1).contribute(0, 0, { value: ethers.utils.parseEther("1") });

    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for deadline

    await campaign.connect(owner).withdraw(0);
    const result = await campaign.getCampaign(0);
    expect(result.status).to.equal(2); // Successful
    expect(result.ownerWithdrawn).to.equal(true);
  });
});