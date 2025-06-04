import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MelodyneConfig = buildModule("MelodyneConfig", (m) => {
  const melodyneConfig = m.contract("MelodyneConfig");
  return { melodyneConfig };
});

export default MelodyneConfig;