import { expect } from 'chai';

describe('Melodyne Fundraiser', function () {
  let usdc, melodyne;
  let owner, donor1, donor2;

  beforeEach(async () => {
    [owner, donor1, donor2] = await ethers.getSigners();

    // Deploy mock USDC with 6 decimals
    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    usdc = await MockUSDC.deploy();
    await usdc.deployed();

    // Deploy Melodyne with USDC address
    const Melodyne = await ethers.getContractFactory('Melodyne');
    melodyne = await Melodyne.deploy(usdc.address);
    await melodyne.deployed();

    // Fund donor1 and donor2 with some USDC
    const amount = ethers.utils.parseUnits('1000', 6);
    await usdc.mint(donor1.address, amount);
    await usdc.mint(donor2.address, amount);
  });


  describe('Campaign creation', () => {
    it('should allow creating a campaign and contributing USDC', async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;
      const amount = ethers.utils.parseUnits('10', 6);

      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      await melodyne.connect(owner).addTier(0, amount);
      await melodyne.connect(owner).publishCampaign(0);
      await usdc.connect(donor1).approve(melodyne.address, amount);
      await melodyne.connect(donor1).contribute(0, 0);

      const campaign = await melodyne.getCampaign(0);
      expect(campaign.totalContributed.toString()).to.equal('10000000');
    });

    it('Should create a campaign with valid parameters');
    it('Should revert if goal > hardCap');
    it('Should revert if deadline is in the past');
  });

  describe('Tier management', () => {
    it('Should allow owner to add tiers (Max 5)');
    it('Should allow only campaign owner to add tier');
    it('Should revert adding tier with amount 0');
  });

  describe('Publishing', () => {
    it('Should publish a campaign');
    it('Should revert if no tiers are added');
  });

  describe('Contributions and Status updates', () => {
    it('Should allow a donor to contribute successfully');
    it('Should revert on contributing to draft campaign');
    it('Should update campaign status to SoldOut when hardCap reached');
    it('Should update campaign status to Successful after deadline if goal is met');
    it('Should update campaign status to Failed after deadline if goal not met');
  });

  describe('Refunds', () => {
    it('Should allow donors to get a refund if campaign failed');
  });

  describe('Owner Withdrawal', () => {
    it('Should allow owner to withdraw funds if campaign successful');
    it('Should revert owner withdraw if already withdrawn');
    it('Should revert withdrawal if not successful');
  });
});
