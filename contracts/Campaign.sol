// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CampaignManager {
    IERC20 public immutable usdc;
    enum CampaignStatus { Draft, Published, Successful, Failed, SoldOut }

    constructor(address _usdcAddress) {
        usdc = IERC20(_usdcAddress);
    }

    struct Tier {
        uint256 amount;
    }

    struct Campaign {
        address owner;
        uint256 goal;
        uint256 hardCap;
        uint256 deadline;
        CampaignStatus status;
        uint256 totalContributed;
        Tier[] tiers;
        mapping(address => uint256) contributions;
        bool ownerWithdrawn;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) private campaigns;

    event CampaignCreated(uint256 indexed id, address indexed owner);
    event CampaignPublished(uint256 indexed id);
    event TierAdded(uint256 indexed id, uint256 tierAmount);
    event Contributed(uint256 indexed id, address indexed donor, uint256 amount);
    event Refunded(uint256 indexed id, address indexed donor, uint256 amount);
    event OwnerWithdrawn(uint256 indexed id);

    modifier onlyOwner(uint256 _id) {
        require(campaigns[_id].owner == msg.sender, "Not owner");
        _;
    }

    modifier isDraft(uint256 _id) {
        require(campaigns[_id].status == CampaignStatus.Draft, "Not draft");
        _;
    }

    function createCampaign(uint256 _goal, uint256 _hardCap, uint256 _deadline) external {
        require(_goal <= _hardCap, "Goal exceeds cap");
        require(_deadline > block.timestamp, "Invalid deadline");

        Campaign storage c = campaigns[campaignCount];
        c.owner = msg.sender;
        c.goal = _goal;
        c.hardCap = _hardCap;
        c.deadline = _deadline;
        c.status = CampaignStatus.Draft;

        emit CampaignCreated(campaignCount, msg.sender);
        campaignCount++;
    }

    function addTier(uint256 _id, uint256 _amount) external onlyOwner(_id) isDraft(_id) {
        Campaign storage c = campaigns[_id];
        require(c.tiers.length < 5, "Max 5 tiers");
        require(_amount > 0, "Amount must be > 0");
        c.tiers.push(Tier(_amount));
        emit TierAdded(_id, _amount);
    }

    function publishCampaign(uint256 _id) external onlyOwner(_id) isDraft(_id) {
        Campaign storage c = campaigns[_id];
        require(c.tiers.length > 0, "At least one tier required");
        c.status = CampaignStatus.Published;
        emit CampaignPublished(_id);
    }

    function contribute(uint256 _id, uint256 _tierIndex) external {
        Campaign storage c = campaigns[_id];
        require(c.status != CampaignStatus.Draft, "Not published yet");
        require(c.status != CampaignStatus.SoldOut, "Already sold out");
        require(c.status != CampaignStatus.Failed, "Has failed");
        require(block.timestamp < c.deadline, "Campaign ended");
        require(_tierIndex < c.tiers.length, "Invalid tier");

        uint256 amount = c.tiers[_tierIndex].amount;

        // Transfer USDC from contributor to contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        c.totalContributed += amount;
        c.contributions[msg.sender] += amount;
        emit Contributed(_id, msg.sender, amount);

        _updateStatus(_id);
    }

    function _updateStatus(uint256 _id) internal {
        Campaign storage c = campaigns[_id];

        if (c.totalContributed >= c.hardCap) {
            c.status = CampaignStatus.SoldOut;
        } else if (block.timestamp >= c.deadline) {
            if (c.totalContributed >= c.goal) {
                c.status = CampaignStatus.Successful;
            } else {
                c.status = CampaignStatus.Failed;
            }
        }
    }

    function refund(uint256 _id) external {
        Campaign storage c = campaigns[_id];
        require(
            c.status == CampaignStatus.Failed || (c.status == CampaignStatus.Published && c.deadline <= block.timestamp),
            "Not refundable"
        );
        uint256 amount = c.contributions[msg.sender];
        require(amount > 0, "No contribution");
        c.contributions[msg.sender] = 0;
        require(usdc.transfer(msg.sender, amount), "Refund failed");

        emit Refunded(_id, msg.sender, amount);

        _updateStatus(_id);
    }

    function withdraw(uint256 _id) external onlyOwner(_id) {
        Campaign storage c = campaigns[_id];
        require(c.status == CampaignStatus.Successful || c.status == CampaignStatus.SoldOut, "Not allowed");
        require(!c.ownerWithdrawn, "Already withdrawn");

        c.ownerWithdrawn = true;
        require(usdc.transfer(c.owner, c.totalContributed), "Withdraw failed");

        emit OwnerWithdrawn(_id);
    }

    // View functions
    function getCampaign(uint256 _id) external view returns (
        address owner,
        uint256 goal,
        uint256 hardCap,
        uint256 deadline,
        CampaignStatus status,
        uint256 totalContributed,
        uint256 tierCount,
        bool ownerWithdrawn
    ) {
        Campaign storage c = campaigns[_id];
        return (
            c.owner,
            c.goal,
            c.hardCap,
            c.deadline,
            c.status,
            c.totalContributed,
            c.tiers.length,
            c.ownerWithdrawn
        );
    }

    function getTier(uint256 _id, uint256 _tierIndex) external view returns (uint256) {
        Campaign storage c = campaigns[_id];
        require(_tierIndex < c.tiers.length, "Invalid index");
        return c.tiers[_tierIndex].amount;
    }
}