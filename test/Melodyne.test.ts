import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Melodyne Fundraiser', function () {
  let usdc, melodyne, config;
  let owner, donor1, donor2;

  beforeEach(async () => {
    [owner, donor1, donor2] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    usdc = await MockUSDC.deploy();
    await usdc.deployed();

    const MelodyneConfig = await ethers.getContractFactory('MelodyneConfig');
    config = await MelodyneConfig.deploy();
    await config.deployed();

    await config.setPlatformFeeBps(500); // 5%
    await config.setFeeRecipient(owner.address);
    await config.setCampaignDurations(60, 30 * 24 * 60 * 60); // 1 min to 30 days
    await config.setMaxActiveCampaignsPerUser(3);
    await config.setAllowedToken(usdc.address, true);
    await config.togglePause(false);
    await config.setCampaignCreationFee(0);
    await config.setCampaignFeeToken(usdc.address); // Use USDC for simplicity

    const Melodyne = await ethers.getContractFactory('MelodyneV3');
    melodyne = await Melodyne.deploy(usdc.address, config.address);
    await melodyne.deployed();

    const amount = ethers.utils.parseUnits('1000', 6);
    await usdc.mint(donor1.address, amount);
    await usdc.mint(donor2.address, amount);
  });

  describe('Campaign creation', () => {
    it.skip('Should create a campaign with valid parameters', async () => {
      const goal = ethers.utils.parseUnits('50', 6);
      const cap = ethers.utils.parseUnits('100', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      await expect(melodyne.connect(owner).createCampaign(goal, cap, deadline))
        .to.emit(melodyne, 'CampaignCreated')
        .withArgs(0, owner.address);
    });

    it('Should revert if goal > hardCap', async () => {
      const goal = ethers.utils.parseUnits('200', 6);
      const cap = ethers.utils.parseUnits('100', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      try {
        await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      } catch (e) {
        expect(e.message).to.include('Goal exceeds cap');
      }
    });

    it('Should revert if deadline is in the past', async () => {
      const goal = ethers.utils.parseUnits('50', 6);
      const cap = ethers.utils.parseUnits('100', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp - 10;

      try {
        await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      } catch (e) {
        expect(e.message).to.include('Invalid deadline');
      }
    });

    it('Should revert if platform is paused', async () => {
      await config.togglePause(true);
      const goal = ethers.utils.parseUnits('10', 6);
      const cap = ethers.utils.parseUnits('20', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      try {
        await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      } catch (e) {
        expect(e.message).to.include("Platform is paused");
      }
    });

    it('Should revert if duration is below minimum', async () => {
      await config.setCampaignDurations(3600, 36000); // 1 hour
      const now = (await ethers.provider.getBlock('latest')).timestamp;
      const deadline = now + 300; // 5 min

      const goal = ethers.utils.parseUnits('10', 6);
      const cap = ethers.utils.parseUnits('20', 6);

      try {
        await melodyne.createCampaign(goal, cap, deadline);
      } catch (e) {
        expect(e.message).to.include("Below min duration");
      }
    });

    it('Should revert if duration is above maximum', async () => {
      await config.setCampaignDurations(360, 3600); // 1 hour
      const now = (await ethers.provider.getBlock('latest')).timestamp;
      const deadline = now + 86400; // 1 day

      const goal = ethers.utils.parseUnits('10', 6);
      const cap = ethers.utils.parseUnits('20', 6);

      try {
        await melodyne.createCampaign(goal, cap, deadline)
      } catch (e) {
        expect(e.message).to.include("Above max duration");
      }
    });

    it('Should revert if creation fee required but not approved', async () => {
      await config.setCampaignCreationFee(ethers.utils.parseUnits('5', 6));
      await config.setCampaignFeeToken(usdc.address);
      await config.setFeeRecipient(owner.address); // any valid address

      const goal = ethers.utils.parseUnits('10', 6);
      const cap = ethers.utils.parseUnits('20', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      try {
        await melodyne.createCampaign(goal, cap, deadline)
      } catch (e) {
        expect(e.message).to.include("ERC20InsufficientAllowance");
      }
    });

    it('Should succeed if creation fee approved and transferred', async () => {
      const fee = ethers.utils.parseUnits('5', 6);
      await config.setCampaignCreationFee(fee);
      await config.setCampaignFeeToken(usdc.address);
      await config.setFeeRecipient(owner.address);

      const goal = ethers.utils.parseUnits('10', 6);
      const cap = ethers.utils.parseUnits('20', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      await usdc.connect(donor1).approve(melodyne.address, fee);

      const balanceBefore = await usdc.balanceOf(owner.address);

      await melodyne.connect(donor1).createCampaign(goal, cap, deadline);

      const balanceAfter = await usdc.balanceOf(owner.address);
      const diff = await balanceAfter.sub(balanceBefore)
      expect(diff.toString()).to.equal(fee.toString());
    });

    it('Should revert if user exceeds max active campaigns', async () => {
      await config.setMaxActiveCampaignsPerUser(1);
      const now = (await ethers.provider.getBlock('latest')).timestamp;
      const goal = ethers.utils.parseUnits('10', 6);
      const cap = ethers.utils.parseUnits('20', 6);
      const deadline = now + 3600;

      // First campaign
      await melodyne.createCampaign(goal, cap, deadline);

      // Second campaign attempt should fail
      try {
        await melodyne.createCampaign(goal, cap, deadline)
      } catch (e) {
        expect(e.message).to.include("Too many active");
      }
    });
  });

  describe('Tier management', () => {
    beforeEach(async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;
      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
    });

    it('Should allow owner to add tiers (Max 5)', async () => {
      for (let i = 0; i < 5; i++) {
        await melodyne.connect(owner).addTier(0, 1000)
        // await expect()
        //   .to.emit(melodyne, 'TierAdded')
        //   .withArgs(0, 1000);
      }

      try {
        melodyne.connect(owner).addTier(0, 1000)
        await melodyne.connect(owner).addTier(0, 1000);
      } catch (e) {
        expect(e.message).to.include('Max 5 tiers');
      }
    });

    it('Should allow only campaign owner to add tier', async () => {
      try {
        await melodyne.connect(donor1).addTier(0, 1000)
      } catch (e) {
        expect(e.message).to.include('Not owner');
      }
    });

    it('Should revert adding tier with amount 0', async () => {
      try {
        await melodyne.connect(owner).addTier(0, 0);
      } catch (e) {
        expect(e.message).to.include('Amount must be > 0');
      }
    });
  });

  describe('Publishing', () => {
    beforeEach(async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;
      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
    });

    it.skip('Should publish a campaign', async () => {
      await melodyne.connect(owner).addTier(0, 1000);
      await expect(melodyne.connect(owner).publishCampaign(0))
        .to.emit(melodyne, 'CampaignPublished')
        .withArgs(0);
    });

    it('Should revert if no tiers are added', async () => {
      try {
        await melodyne.connect(owner).publishCampaign(0);
      } catch (e) {
        expect(e.message).to.include('At least one tier required');
      }
    });
  });

  describe('Contributions and Status updates', () => {
    beforeEach(async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      await melodyne.connect(owner).addTier(0, ethers.utils.parseUnits('100', 6));
      await melodyne.connect(owner).publishCampaign(0);
    });

    it('Should allow a donor to contribute successfully', async () => {
      const amount = ethers.utils.parseUnits('100', 6);
      await usdc.connect(donor1).approve(melodyne.address, amount);
      await melodyne.connect(donor1).contribute(0, 0);

      const campaign = await melodyne.getCampaign(0);
      expect(campaign.totalContributed.toString()).to.equal('100000000');
    });

    it('Should revert on contributing to draft campaign', async () => {
      const amount = ethers.utils.parseUnits('10', 6);
      await melodyne.connect(owner).createCampaign(amount, amount, (await ethers.provider.getBlock('latest')).timestamp + 3600);
      await melodyne.connect(owner).addTier(1, amount);
      await usdc.connect(donor1).approve(melodyne.address, amount);

      try {
        await melodyne.connect(donor1).contribute(1, 0);
      } catch (e) {
        expect(e.message).to.include('Not published yet');
      }
    });

    it('Should update campaign status to SoldOut when hardCap reached', async () => {
      const amount = ethers.utils.parseUnits('200', 6);
      await usdc.connect(donor1).approve(melodyne.address, amount);
      await melodyne.connect(donor1).contribute(0, 0);
      await melodyne.connect(donor1).contribute(0, 0);

      const campaign = await melodyne.getCampaign(0);
      expect(campaign.status).to.equal(4); // SoldOut enum
    });

    it('Should update campaign status to Successful after deadline if goal is met', async () => {
      const amount = ethers.utils.parseUnits('100', 6);
      await usdc.connect(donor1).approve(melodyne.address, amount);
      await melodyne.connect(donor1).contribute(0, 0);

      await ethers.provider.send('evm_increaseTime', [3700]);
      await ethers.provider.send('evm_mine', []);

      const campaign = await melodyne.getCampaign(0);
      expect(campaign.status).to.equal(2); // Successful
    });

    it('Should update campaign status to Failed after deadline if goal not met', async () => {
      await ethers.provider.send('evm_increaseTime', [3700]);
      await ethers.provider.send('evm_mine', []);

      try {
        await melodyne.connect(donor1).refund(0);
      } catch (e) {
        expect(e.message).to.include('No contribution');
      }
    });
  });

  describe('Refunds', () => {
    it.skip('Should allow donors to get a refund if campaign failed', async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 10;

      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      await melodyne.connect(owner).addTier(0, ethers.utils.parseUnits('10', 6));
      await melodyne.connect(owner).publishCampaign(0);

      await usdc.connect(donor1).approve(melodyne.address, ethers.utils.parseUnits('10', 6));
      await melodyne.connect(donor1).contribute(0, 0);

      await ethers.provider.send('evm_increaseTime', [15]);
      await ethers.provider.send('evm_mine', []);

      await expect(melodyne.connect(donor1).refund(0))
        .to.emit(melodyne, 'Refunded')
        .withArgs(0, donor1.address, ethers.utils.parseUnits('10', 6));
    });
  });

  describe('Owner Withdrawal', () => {
    it.skip('Should allow owner to withdraw funds if campaign successful', async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      await melodyne.connect(owner).addTier(0, goal);
      await melodyne.connect(owner).publishCampaign(0);

      await usdc.connect(donor1).approve(melodyne.address, goal);
      await melodyne.connect(donor1).contribute(0, 0);

      await ethers.provider.send('evm_increaseTime', [3700]);
      await ethers.provider.send('evm_mine', []);


      await expect(melodyne.connect(owner).withdraw(0))
        .to.emit(melodyne, 'OwnerWithdrawn')
        .withArgs(0);
    });

    it('Should revert owner withdraw if already withdrawn', async () => {
      // Can be chained after successful withdrawal test
    });

    it('Should revert withdrawal if not successful', async () => {
      const goal = ethers.utils.parseUnits('100', 6);
      const cap = ethers.utils.parseUnits('150', 6);
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

      await melodyne.connect(owner).createCampaign(goal, cap, deadline);
      await melodyne.connect(owner).addTier(0, goal);
      await melodyne.connect(owner).publishCampaign(0);

      try {
        await melodyne.connect(owner).withdraw(0);
      } catch (e) {
        await expect(e.message).to.include('Not allowed');
      }
    });
  });
});