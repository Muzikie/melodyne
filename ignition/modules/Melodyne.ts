import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MelodyneModule = buildModule("MelodyneV2", (m) => {
  const usdcAddress = "0x3ba742FD7502a6395D234e024A64c78705496dfE";

  const melodyne = m.contract("MelodyneV2", [usdcAddress]);

  return { melodyne };
});

export default MelodyneModule;