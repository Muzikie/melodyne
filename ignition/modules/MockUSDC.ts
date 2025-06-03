import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockUSDC = buildModule("MockUSDC", (m) => {
  const mockUSDC = m.contract("MockUSDC");
  return { mockUSDC };
});

export default MockUSDC;