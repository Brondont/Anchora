// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Offer.sol";

contract OfferFactory is AccessControl {
    bytes32 public constant TENDER_ROLE = keccak256("TENDER_ROLE");
    bytes32 public constant ENTREPRENEUR_ROLE = keccak256("ENTREPRENEUR_ROLE");
    bytes32 public constant EXPERT_ROLE = keccak256("EXPERT_ROLE");

    address[] public allOffers;

    event OfferCreated(address indexed offerAddress, address indexed tender);

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    function hasRole(
        bytes32 role,
        address account
    ) public view override returns (bool) {
        return super.hasRole(role, account);
    }

    function createOffer(
        uint256 submissionStart,
        uint256 submissionEnd,
        uint256 reviewStart,
        uint256 reviewEnd
    ) external onlyRole(TENDER_ROLE) {
        // validatoin for proper time periods
        require(submissionStart < submissionEnd, "Bad submission window");
        require(submissionEnd < reviewStart, "Review must follow submission");
        require(reviewStart < reviewEnd, "Bad review window");

        Offer newOffer = new Offer(
            msg.sender,
            address(this),
            submissionStart,
            submissionEnd,
            reviewStart,
            reviewEnd
        );
        allOffers.push(address(newOffer));
        emit OfferCreated(address(newOffer), msg.sender);
    }
}
