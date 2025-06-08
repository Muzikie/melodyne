#!/bin/bash

set -e

# === Input parameters ===
VERSION=$1
NETWORK=$2
CONTRACT_NAME=$3

# === Derived names ===
MODULE_FILE="ignition/modules/${CONTRACT_NAME}${VERSION}.ts"
MODULE_NAME="${CONTRACT_NAME}${VERSION}"
TAG_NAME="${MODULE_NAME}-${NETWORK}"

# === Validate input ===
if [[ -z "$VERSION" || -z "$NETWORK" || -z "$CONTRACT_NAME" ]]; then
  echo "Usage: ./deploy.sh <version> <network> <contract_name>"
  echo "Example: ./deploy.sh V12 lisk-sepolia Melodyne"
  exit 1
fi

# === Check contract file exists ===
CONTRACT_FILE="contracts/${CONTRACT_NAME}.sol"
if [[ ! -f "$CONTRACT_FILE" ]]; then
  echo "❌ Contract file not found: $CONTRACT_FILE"
  exit 1
fi

# === Update version in the Solidity contract ===
VERSION_NUMBER="${VERSION//[!0-9]/}" # Extract number from V12 → 12
echo "🛠 Updating VERSION in $CONTRACT_FILE to $VERSION_NUMBER"

# Check if VERSION line exists
if grep -q 'string public constant VERSION' "$CONTRACT_FILE"; then
  sed -i.bak -E "s/string public constant VERSION = \".*\";/string public constant VERSION = \"${VERSION_NUMBER}\";/" "$CONTRACT_FILE"
  rm "${CONTRACT_FILE}.bak"
else
  echo "❌ VERSION line not found in $CONTRACT_FILE"
  exit 1
fi



# === Create new ignition module ===
echo "🚀 Creating Ignition module: $MODULE_FILE"
VAR_NAME=$(echo "$CONTRACT_NAME" | tr '[:upper:]' '[:lower:]')

cat > "$MODULE_FILE" <<EOF
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import deployments from '../../deploy-config.json';

const NETWORK = "${NETWORK}";
const USDC_ADDRESS = deployments[NETWORK].USDC;
const CONFIG_ADDRESS = deployments[NETWORK].MelodyneConfig;

export default buildModule("${MODULE_NAME}", (m) => {
  const ${VAR_NAME} = m.contract("${CONTRACT_NAME}", [USDC_ADDRESS, CONFIG_ADDRESS]);
  return { ${VAR_NAME} };
});
EOF

# === Compile contracts ===
echo "🔨 Compiling contracts..."
yarn compile

# === Deploy to network ===
echo "🚀 Deploying $MODULE_NAME to network $NETWORK..."

DEPLOY_OUTPUT=$(npx hardhat ignition deploy "$MODULE_FILE" --network "$NETWORK")

echo "$DEPLOY_OUTPUT"

DEPLOYED_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "$MODULE_NAME#${MODULE_NAME} - 0x[a-fA-F0-9]{40}" | awk '{print $3}')

if [ -z "$DEPLOYED_ADDRESS" ]; then
  echo "❌ Could not parse deployed address from deploy output!"
  exit 1
fi

echo "📬 Deployed $MODULE_NAME at $DEPLOYED_ADDRESS"

# Update deploy-config.json
TMP_CONFIG=$(mktemp)
jq --arg net "$NETWORK" --arg addr "$DEPLOYED_ADDRESS" '.[$net].Melodyne = $addr' "$DEPLOY_CONFIG" > "$TMP_CONFIG" && mv "$TMP_CONFIG" "$DEPLOY_CONFIG"

echo "📝 Updated $DEPLOY_CONFIG with Melodyne address for $NETWORK"

# === Git commit, tag, and push ===
echo "📁 Committing changes and tagging version..."
git add "$MODULE_FILE"
git commit -m "Deploy ${MODULE_NAME} to ${NETWORK}"
git tag "$TAG_NAME"
git push origin main --tags

echo "✅ Done! Tagged: $TAG_NAME"