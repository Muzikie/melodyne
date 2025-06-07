// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IMelodyneConfig {
    function platformFeeBps() external view returns (uint256);
    function feeRecipient() external view returns (address);
    function campaignCreationFee() external view returns (uint256);
    function campaignFeeToken() external view returns (address);
    function isPaused() external view returns (bool);
    function minCampaignDuration() external view returns (uint256);
    function maxCampaignDuration() external view returns (uint256);
    function maxActiveCampaignsPerUser() external view returns (uint256);
    function isTokenAllowed(address token) external view returns (bool);
}