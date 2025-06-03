const { ethers } = require("hardhat");

// To test the interactions use
// npx hardhat run scripts/usdcInteractions.js --network lisk-sepolia
async function main() {
  // Replace with your contract address
  const contractAddress = "0x3ba742FD7502a6395D234e024A64c78705496dfE";

  // Attach to the deployed contract
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = MockUSDC.attach(contractAddress);

  // Example: Check the contract name
  const name = await mockUSDC.name();
  console.log("Token name:", name);

  // Example: Check the balance of a specific address
  const [owner] = await ethers.getSigners();
  const balance = await mockUSDC.balanceOf(owner.address);
  console.log("Owner balance:", ethers.utils.formatUnits(balance, 6));

  // Example: Transfer tokens to another address
  const recipient = "0x448d48C286Df7c268Ac9e65e9Ea537629A313147";
  await mockUSDC.transfer(recipient, ethers.utils.parseUnits("10", 6));
  console.log("Transferred 10 tokens to recipient");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
