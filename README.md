# Melodyne
## The Smart Contract of Muzikie

A fundraising smart contract system for **Lisk L2 on Optimism**. Users can create campaigns with tiered contributions, hard caps, goals, and deadlines. Campaigns can succeed, fail, or sell out — and refunds or withdrawals are supported depending on the campaign outcome.


- [Lisk Testnet deployment](https://sepolia-blockscout.lisk.com/address/0xE7aadAeBc5f2c5c3aE95F3dCE8AAb3e178D76432?tab=contract)
- [Lisk Mainnet deployment]()



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

## ✅ Deploy
Use the `./deploy.sh` file to automatically deploy a new version of each contract. The bash script will
 - Update all required files,
 - Create new ignition module file,
 - Compile the changed files
 - Deploy the new version
 - Commit, tag and push the changes.
For example you can run:

```
sh deploy.sh V1 lisk-sepolia Melodyne
```
to deploy the first version of `Melodyne` on `lisk-sepolia`.

Note that the version number should include `V` followed by an integer. 

---

## 🧱 Interactions
To test the interactions using the deployed version, there are scripts to perform all available actions. For example

```
NETWORK=lisk-sepolia npx hardhat run scripts/melodyneInteractions.js --network lisk-sepolia  
```

Remeber to pass the network value.


---

## 🧱 Addresses
- Lisk Sepolia
  - Deployer Account: `0xEB32c9fc9c5553f698C95AC5bA218fD70843fD53`
  - USDC: `0x3ba742FD7502a6395D234e024A64c78705496dfE`,
  - MelodyneConfig: `0x16cfDd7598cc34F3d392571A3a0c66C9E1BCB6Cd`,
  - Melodyne: `0x04028B70b21D30739922f6829FdDae61698aC78b`,
- Lisk Mainnet
  - Melodyne: ``

## 📄 License
MIT — open source and free to use for any project.
