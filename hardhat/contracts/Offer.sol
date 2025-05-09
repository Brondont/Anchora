// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IOfferFactory {
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}

error Unauthorized();

error InvalidStage(uint8 currentStage);
error InvalidScore(uint8 provided);
error AlreadyScored(address expert);
error NoProposal(address entrepreneur);
error ProposalAlreadySubmitted();

contract Offer is AccessControl {
    address public factory;

    uint256 public submissionStart;
    uint256 public submissionEnd;
    uint256 public reviewStart;
    uint256 public reviewEnd;

    bytes32 public constant ENTREPRENEUR_ROLE = keccak256("ENTREPRENEUR_ROLE");
    bytes32 public constant EXPERT_ROLE = keccak256("EXPERT_ROLE");

    constructor(
        address tender_,
        address factory_,
        uint256 submissionStart_,
        uint256 submissionEnd_,
        uint256 reviewStart_,
        uint256 reviewEnd_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, tender_);

        factory = factory_;

        submissionStart = submissionStart_;
        submissionEnd = submissionEnd_;
        reviewStart = reviewStart_;
        reviewEnd = reviewEnd_;
    }

    // modifiers for checking roles iwth the factory contract
    modifier onlyEntrepreneur() {
        if (!IOfferFactory(factory).hasRole(ENTREPRENEUR_ROLE, msg.sender))
            revert Unauthorized();
        _;
    }

    modifier onlyExpert() {
        if (!IOfferFactory(factory).hasRole(EXPERT_ROLE, msg.sender))
            revert Unauthorized();
        _;
    }
}
