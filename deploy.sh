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
VAR_NAME=$(echo "${CONTRACT_NAME:0:1}" | tr '[:upper:]' '[:lower:]')${CONTRACT_NAME:1}
ARGS_LINE=""
if [[ "$CONTRACT_NAME" == "Melodyne" ]]; then
  ARGS_LINE="[USDC_ADDRESS, CONFIG_ADDRESS]"
else
  ARGS_LINE=""
fi

cat > "$MODULE_FILE" <<EOF
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import deployments from '../../deploy-config.json';

const NETWORK = "${NETWORK}";
const USDC_ADDRESS = deployments[NETWORK].USDC;
const CONFIG_ADDRESS = deployments[NETWORK].MelodyneConfig;

export default buildModule("${MODULE_NAME}", (m) => {
  const ${VAR_NAME} = m.contract("${CONTRACT_NAME}"${ARGS_LINE:+, $ARGS_LINE});
  return { ${VAR_NAME} };
});
EOF

# === Compile contracts ===
echo "🔨 Compiling contracts..."
yarn compile --force

# === Deploy to network ===
echo "🚀 Deploying $MODULE_NAME to network $NETWORK..."

DEPLOY_OUTPUT=$(yes | npx hardhat ignition deploy "$MODULE_FILE" --network "$NETWORK")

echo "$DEPLOY_OUTPUT"

# ✅ Extract deployed address using POSIX grep
DEPLOYED_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE "${MODULE_NAME}#${CONTRACT_NAME} - 0x[a-fA-F0-9]{40}" | awk '{print $3}')

if [ -z "$DEPLOYED_ADDRESS" ]; then
  echo "❌ Could not parse deployed address from deploy output!"
  exit 1
fi

echo "✅ Deployed $CONTRACT_NAME to $DEPLOYED_ADDRESS"

# ✅ Update deploy-config.json
CONFIG_FILE="deploy-config.json"
TMP_FILE=$(mktemp)

if [ ! -f "$CONFIG_FILE" ]; then
  echo "{}" > "$CONFIG_FILE"
fi

# Add or update the entry in JSON
jq --arg net "$NETWORK" \
   --arg addr "$DEPLOYED_ADDRESS" \
   --arg ver "V${VERSION_NUMBER}" '
  .[$net] = (.[$net] // {})
    + { ("Melodyne" + $ver): $addr }
    + { "Melodyne": $addr }
' "$CONFIG_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$CONFIG_FILE"

echo "✅ Updated $CONFIG_FILE"

# ✅ Git commit and tag
git add "$CONFIG_FILE" "contracts/$CONTRACT_NAME.sol" "ignition/modules/$MODULE_NAME.ts"
git commit -m "ci:deploy $MODULE_NAME to $NETWORK: $DEPLOYED_ADDRESS"
git tag "$MODULE_NAME-$NETWORK-$VERSION"
git push origin HEAD --tags

echo "✅ Done! Tagged: $MODULE_NAME-$NETWORK"