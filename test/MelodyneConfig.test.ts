import { expect } from "chai";
import { ethers } from "hardhat";
import { MelodyneConfig } from "../typechain-types";

describe("MelodyneConfig", function () {
  let config: MelodyneConfig;
  let owner: any;
  let addr1: any;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    const ConfigFactory = await ethers.getContractFactory("MelodyneConfig");
    config = await ConfigFactory.deploy();
    await config.deployed();
  });

  it("should set the owner to deployer", async () => {
    expect(await config.owner()).to.equal(owner.address);
  });

  it("should allow owner to update platform fee", async () => {
    await config.setPlatformFeeBps(500); // 5%
    const bps = await config.platformFeeBps()
    expect(bps.toString()).to.equal('500');
  });

  it("should reject platform fee > 100%", async () => {
    try {
      await config.setPlatformFeeBps(10001)
    } catch (e) {
      expect(e.message).to.include("Fee cannot exceed 100%");
    }
  });

  it("should allow updating fee recipient", async () => {
    await config.setFeeRecipient(addr1.address);
    expect(await config.feeRecipient()).to.equal(addr1.address);
  });

  it("should update campaign durations", async () => {
    await config.setCampaignDurations(1, 100);
    const min = await config.minCampaignDuration();
    const max = await config.maxCampaignDuration();
    expect(min.toString()).to.equal('1');
    expect(max.toString()).to.equal('100');
  });

  it("should reject if min > max for durations", async () => {
    try {
      await config.setCampaignDurations(100, 10);
    } catch (e) {
      await expect(e.message).to.include("Min cannot exceed max");
    }
  });

  it("should allow enabling a token", async () => {
    const token = addr1.address;
    await config.setAllowedToken(token, true);
    expect(await config.isTokenAllowed(token)).to.equal(true);
  });

  it("should toggle pause", async () => {
    await config.togglePause(true);
    expect(await config.isPaused()).to.equal(true);
  });

  it("should allow setting campaign creation fee to zero", async () => {
    await config.setCampaignCreationFee(0);
    const val = await config.campaignCreationFee();
    expect(val.toString()).to.equal('0');
  });

  it("should allow setting campaign fee token", async () => {
    const token = addr1.address;
    await config.setCampaignFeeToken(token);
    expect(await config.campaignFeeToken()).to.equal(token);
  });

  it("should allow updating max active campaigns", async () => {
    await config.setMaxActiveCampaignsPerUser(3);
    const val = await config.maxActiveCampaignsPerUser();
    expect(val.toString()).to.equal('3');
  });

  it("non-owner should not be able to set config values", async () => {
    try {
      await config.connect(addr1).setPlatformFeeBps(100);
    } catch (e) {
      expect(e.message).to.include("OwnableUnauthorizedAccount");
    }
  });
});