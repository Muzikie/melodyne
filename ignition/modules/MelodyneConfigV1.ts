import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import deployments from '../../deploy-config.json';

const NETWORK = "lisk";
const USDC_ADDRESS = deployments[NETWORK].USDC;
const CONFIG_ADDRESS = deployments[NETWORK].MelodyneConfig;

export default buildModule("MelodyneConfigV1", (m) => {
  const melodyneConfig = m.contract("MelodyneConfig");
  return { melodyneConfig };
});
