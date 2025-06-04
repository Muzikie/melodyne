
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MelodyneConfig is Ownable {
    // --- Core Business Logic ---
    uint256 public platformFeeBps;
    address public feeRecipient;

    // --- Campaign Rules ---
    uint256 public minCampaignDuration;
    uint256 public maxCampaignDuration;
    uint256 public maxActiveCampaignsPerUser;

    // --- Token Control ---
    mapping(address => bool) public allowedTokens;

    // --- Platform Controls ---
    bool public isPaused;
    uint256 public campaignCreationFee;
    address public campaignFeeToken;

    // --- Events ---
    event PlatformFeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);
    event CampaignDurationsUpdated(uint256 minDuration, uint256 maxDuration);
    event MaxActiveCampaignsUpdated(uint256 newLimit);
    event AllowedTokenUpdated(address token, bool isAllowed);
    event PauseToggled(bool isPaused);
    event CampaignCreationFeeUpdated(uint256 newFee);
    event CampaignFeeTokenUpdated(address newToken);

    constructor() Ownable(msg.sender) {}

    // --- Setters ---

    function setPlatformFeeBps(uint256 _bps) external onlyOwner {
        require(_bps <= 10_000, "Fee cannot exceed 100%");
        platformFeeBps = _bps;
        emit PlatformFeeUpdated(_bps);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Zero address");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    function setCampaignDurations(uint256 _min, uint256 _max) external onlyOwner {
        require(_min <= _max, "Min cannot exceed max");
        minCampaignDuration = _min;
        maxCampaignDuration = _max;
        emit CampaignDurationsUpdated(_min, _max);
    }

    function setMaxActiveCampaignsPerUser(uint256 _limit) external onlyOwner {
        maxActiveCampaignsPerUser = _limit;
        emit MaxActiveCampaignsUpdated(_limit);
    }

    function setAllowedToken(address _token, bool _isAllowed) external onlyOwner {
        allowedTokens[_token] = _isAllowed;
        emit AllowedTokenUpdated(_token, _isAllowed);
    }

    function togglePause(bool _pause) external onlyOwner {
        isPaused = _pause;
        emit PauseToggled(_pause);
    }

    function setCampaignCreationFee(uint256 _fee) external onlyOwner {
        campaignCreationFee = _fee; // can be 0
        emit CampaignCreationFeeUpdated(_fee);
    }

    function setCampaignFeeToken(address _token) external onlyOwner {
        require(_token != address(0), "Zero address");
        campaignFeeToken = _token;
        emit CampaignFeeTokenUpdated(_token);
    }

    // --- View Helper ---
    function isTokenAllowed(address _token) external view returns (bool) {
        return allowedTokens[_token];
    }
}