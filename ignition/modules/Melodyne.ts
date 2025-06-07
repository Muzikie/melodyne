import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MelodyneModule = buildModule("MelodyneV3", (m) => {
  const usdcAddress = "0x3ba742FD7502a6395D234e024A64c78705496dfE";
  const configAddress = "0x16cfDd7598cc34F3d392571A3a0c66C9E1BCB6Cd";

  const melodyne = m.contract("MelodyneV3", [usdcAddress, configAddress]);

  return { melodyne };
});

export default MelodyneModule;