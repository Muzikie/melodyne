import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("MockUSDC", function () {
  let MockUSDC;
  let mockUSDC;
  let owner: Signer;
  let address1: Signer;
  let address2: Signer;

  beforeEach(async function () {
    MockUSDC = await ethers.getContractFactory("MockUSDC");
    [owner, address1, address2] = await ethers.getSigners();

    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();
  });

  it("Should have the correct name and symbol", async function () {
    expect(await mockUSDC.name()).to.equal("Mock USDC");
    expect(await mockUSDC.symbol()).to.equal("USDC");
  });

  it("Should assign the initial balance to the owner", async function () {
    const ownerBalance = await mockUSDC.balanceOf(owner.address);
    expect(ownerBalance.toString()).to.equal("1000000000000");
  });

  it("Should allow the owner to mint tokens", async function () {
    await mockUSDC.connect(owner).mint(address1.address, ethers.utils.parseUnits("1000", 6));
    const balance = await mockUSDC.balanceOf(address1.address);
    expect(balance.toString()).to.equal("1000000000");
  });

  it("Should not allow a non-owner to mint tokens", async function () {
    let tx;
    try {
        tx = await mockUSDC.connect(address1).mint(address2.address, ethers.utils.parseUnits("1000", 6));
    } catch (e) {
        expect(e.message).to.include("reverted with custom error");
        expect(e.message).to.include("OwnableUnauthorizedAccount");
    }
  });

  it("Should have 6 decimals", async function () {
    expect(await mockUSDC.decimals()).to.equal(6);
  });
});
