import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Melodyne = buildModule("Melodyne", (m) => {
  const melodyne = m.contract("Melodyne");
  return { melodyne };
});

export default Melodyne;