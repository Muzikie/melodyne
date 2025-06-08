import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import deployments from '../../deploy-config.json';

const NETWORK = "lisk-sepolia";
const USDC_ADDRESS = deployments[NETWORK].USDC;
const CONFIG_ADDRESS = deployments[NETWORK].MelodyneConfig;

export default buildModule("MelodyneV16", (m) => {
  const melodyne = m.contract("Melodyne", [USDC_ADDRESS, CONFIG_ADDRESS]);
  return { melodyne };
});
