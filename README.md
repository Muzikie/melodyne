# Melodyne
## The Smart Contract of Muzikie

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
git clone https://github.com/Muzikie/melodyne.git
cd melodyne
yarn install
```
---

## 🧪 Run Tests
```
yarn test
```

---

## 📂 Project Structure
```
contracts/
│   Melodyne.sol               # Main contract
│   MockUSDC.sol               # Mock USDC to use on Sepolia
ignition/modules/
│   Melodyne.ts               # Deployment module
│   MockUSDC.ts               # USDC token module
test/
│   usdcInteractions.ts       # TS scripts to interact with USDC for testing purposes
test/
│   Campaign.ts               # Tests for contract logic
│   MockUSDC.test.ts          # Tests for USDC contract logic
hardhat.config.ts             # Hardhat config
```

---

## 🧱 Addresses
- Lisk Sepolia
  - USDC: `0x3ba742FD7502a6395D234e024A64c78705496dfE`
  - CampaignManager: `0xE7aadAeBc5f2c5c3aE95F3dCE8AAb3e178D76432`
  - Melodyne: ``
- Lisk Mainnet
  - Melodyne: ``

## 📄 License
MIT — open source and free to use for any project.
