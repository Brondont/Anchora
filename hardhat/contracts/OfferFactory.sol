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

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function grantTender(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(TENDER_ROLE, account);
    }

    function revokeTender(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(TENDER_ROLE, account);
    }

    function grantEntrepreneur(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ENTREPRENEUR_ROLE, account);
    }

    function revokeEntrepreneur(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ENTREPRENEUR_ROLE, account);
    }

    function grantExpert(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(EXPERT_ROLE, account);
    }

    function revokeExpert(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(EXPERT_ROLE, account);
    }

    function hasRole(
        bytes32 role,
        address account
    ) public view override returns (bool) {
        return super.hasRole(role, account);
    }

    function createOffer() external onlyRole(TENDER_ROLE) {
        Offer newOffer = new Offer(msg.sender, address(this));
        allOffers.push(address(newOffer));
        emit OfferCreated(address(newOffer), msg.sender);
    }
}
