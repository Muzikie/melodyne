import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import deployments from "../../deployments.json";

const NETWORK = process.env.NETWORK || "lisk";
const MELODYNE_VERSION = process.env.MELODYNE_VERSION || "V1";
const USDC_ADDRESS = deployments[NETWORK].MockUSDC;
const CONFIG_ADDRESS = deployments[NETWORK].MelodyneConfig;

const MelodyneModule = buildModule(`Melodyne_${MELODYNE_VERSION}`, (m) => {
  const melodyne = m.contract("Melodyne", [USDC_ADDRESS, CONFIG_ADDRESS]);

  return { melodyne };
});

export default MelodyneModule;
