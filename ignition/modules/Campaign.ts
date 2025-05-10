import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CampaignModule = buildModule("CampaignModule", (m) => {
  const campaignManager = m.contract("CampaignManager");
  return { campaignManager };
});

export default CampaignModule;