# 🎯 CampaignManager Smart Contract

A fundraising smart contract system for **Lisk L2 on Optimism**. Users can create campaigns with tiered contributions, hard caps, goals, and deadlines. Campaigns can succeed, fail, or sell out — and refunds or withdrawals are supported depending on the campaign outcome.

---

## 🚀 Features

- Users can **create campaigns** in draft mode
- Campaigns include:
  - Contribution tiers (up to 5)
  - Hard cap and fundraising goal
  - Deadline and status tracking
- Statuses:
  - `Draft`, `Published`, `Successful`, `Failed`, `SoldOut`
- Donors can contribute based on tiers
- Donors can request **refunds** if the campaign fails
- Owners can **withdraw** funds if the campaign succeeds or sells out

---

## 🧱 Stack

- Solidity (Smart Contracts)
- [Hardhat](https://hardhat.org/) (Development & Testing)
- [Hardhat Ignition](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-ignition) (Deployment)
- TypeScript + Ethers.js (for scripting/tests)
- Lisk L2 on Optimism

---

## 📦 Installation

```bash
git clone https://github.com/YOUR_USERNAME/campaign-fundraising.git
cd campaign-fundraising

npm install
```
---

## 🧪 Run Tests
```
npx hardhat test
```

---

## 📂 Project Structure
```
contracts/
│   CampaignManager.sol       # Main contract
ignition/modules/
│   Campaign.ts               # Deployment module
test/
│   Campaign.ts               # Tests for contract logic
hardhat.config.ts             # Hardhat config
```

---

## 📄 License
MIT — open source and free to use for any project.
