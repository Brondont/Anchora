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
error OfferClosed();
error InvalidProposal();
error NoProposalsSubmitted();
error ProposalNotFound();

contract Offer {
    // Core state variables
    address public factory;
    address public tender;
    bool public isClosed;

    // Time windows
    uint256 public submissionStart;
    uint256 public submissionEnd;
    uint256 public reviewStart;
    uint256 public reviewEnd;

    // Role definitions (matching factory roles)
    bytes32 public constant ENTREPRENEUR_ROLE = keccak256("ENTREPRENEUR_ROLE");
    bytes32 public constant EXPERT_ROLE = keccak256("EXPERT_ROLE");

    // Proposal structure
    struct Proposal {
        address entrepreneur;
        string description;
        uint256 price;
        uint256 totalScore;
        uint256 reviewCount;
        bool exists;
    }

    // Review structure
    struct Review {
        address expert;
        uint8 score;
        bool exists;
    }

    // Storage for proposals and reviews
    address[] public entrepreneurs;
    mapping(address => Proposal) public proposals;
    mapping(address => mapping(address => Review)) public reviews; // entrepreneur => expert => review
    mapping(address => address[]) public entrepreneurReviewers; // entrepreneur => list of experts who reviewed

    // Winner tracking
    address public winningEntrepreneur;
    bool public winnerDeclared;

    // Events
    event ProposalSubmitted(
        address indexed entrepreneur,
        string description,
        uint256 price
    );
    event ProposalReviewed(
        address indexed entrepreneur,
        address indexed expert,
        uint8 score
    );
    event WinnerDeclared(
        address indexed entrepreneur,
        uint256 totalScore,
        uint256 price
    );
    event OfferClosedEvent();

    constructor(
        address tender_,
        address factory_,
        uint256 submissionStart_,
        uint256 submissionEnd_,
        uint256 reviewStart_,
        uint256 reviewEnd_
    ) {
        tender = tender_;
        factory = factory_;
        isClosed = false;

        submissionStart = submissionStart_;
        submissionEnd = submissionEnd_;
        reviewStart = reviewStart_;
        reviewEnd = reviewEnd_;
    }

    // ===== Modifiers =====

    // Role-checking modifiers that use the factory for validation
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

    modifier onlyOwner() {
        if (msg.sender != tender) revert Unauthorized();
        _;
    }

    // Stage-checking modifiers
    modifier duringSubmissionPeriod() {
        if (
            block.timestamp < submissionStart ||
            block.timestamp >= submissionEnd
        ) revert InvalidStage(1);
        if (isClosed) revert OfferClosed();
        _;
    }

    modifier duringReviewPeriod() {
        if (block.timestamp < reviewStart || block.timestamp >= reviewEnd)
            revert InvalidStage(2);
        if (isClosed) revert OfferClosed();
        _;
    }

    modifier afterReviewPeriod() {
        if (block.timestamp < reviewEnd) revert InvalidStage(3);
        if (isClosed) revert OfferClosed();
        _;
    }

    modifier offerActive() {
        if (isClosed) revert OfferClosed();
        _;
    }

    // ===== Entrepreneur Functions =====

    function submitProposal(
        string calldata description,
        uint256 price
    ) external onlyEntrepreneur duringSubmissionPeriod {
        // Check if entrepreneur already submitted a proposal
        if (proposals[msg.sender].exists) revert ProposalAlreadySubmitted();

        // Price must be greater than zero
        if (bytes(description).length == 0 || price == 0)
            revert InvalidProposal();

        // Create and store the proposal
        proposals[msg.sender] = Proposal({
            entrepreneur: msg.sender,
            description: description,
            price: price,
            totalScore: 0,
            reviewCount: 0,
            exists: true
        });

        entrepreneurs.push(msg.sender);

        emit ProposalSubmitted(msg.sender, description, price);
    }

    // ===== Expert Functions =====

    function reviewProposal(
        address entrepreneur,
        uint8 score
    ) external onlyExpert duringReviewPeriod {
        // Validate the proposal exists
        if (!proposals[entrepreneur].exists) revert NoProposal(entrepreneur);

        // Validate score is between 0 and 10
        if (score > 10) revert InvalidScore(score);

        // Check if expert already reviewed this proposal
        if (reviews[entrepreneur][msg.sender].exists)
            revert AlreadyScored(msg.sender);

        // Create and store the review
        reviews[entrepreneur][msg.sender] = Review({
            expert: msg.sender,
            score: score,
            exists: true
        });

        // Update proposal score
        proposals[entrepreneur].totalScore += score;
        proposals[entrepreneur].reviewCount++;

        // Track reviewers for this entrepreneur
        entrepreneurReviewers[entrepreneur].push(msg.sender);

        emit ProposalReviewed(entrepreneur, msg.sender, score);
    }

    // ===== Public/Admin Functions =====

    function declareWinner()
        external
        afterReviewPeriod
        offerActive
        returns (address)
    {
        // Ensure winner hasn't already been declared
        require(!winnerDeclared, "Winner already declared");

        // Ensure there are proposals
        if (entrepreneurs.length == 0) revert NoProposalsSubmitted();

        address bestEntrepreneur = address(0);
        uint256 highestAverageScore = 0;
        uint256 lowestPrice = type(uint256).max;

        // Find the proposal with the highest average score
        for (uint256 i = 0; i < entrepreneurs.length; i++) {
            address entrepreneur = entrepreneurs[i];
            Proposal storage proposal = proposals[entrepreneur];

            // Skip proposals with no reviews
            if (proposal.reviewCount == 0) continue;

            // Calculate average score (scaled by 100 for precision without decimals)
            uint256 averageScore = (proposal.totalScore * 100) /
                proposal.reviewCount;

            if (averageScore > highestAverageScore) {
                highestAverageScore = averageScore;
                bestEntrepreneur = entrepreneur;
                lowestPrice = proposal.price;
            }
            // If tied on score, pick the one with lower price
            else if (
                averageScore == highestAverageScore &&
                proposal.price < lowestPrice
            ) {
                bestEntrepreneur = entrepreneur;
                lowestPrice = proposal.price;
            }
        }

        // Ensure a winner was found
        require(bestEntrepreneur != address(0), "No valid winner found");

        winningEntrepreneur = bestEntrepreneur;
        winnerDeclared = true;

        // Emit winner event with details
        emit WinnerDeclared(
            bestEntrepreneur,
            proposals[bestEntrepreneur].totalScore,
            proposals[bestEntrepreneur].price
        );

        return bestEntrepreneur;
    }

    function closeOffer() external onlyOwner offerActive {
        // If after review period and winner not declared, declare winner first
        if (
            block.timestamp >= reviewEnd &&
            !winnerDeclared &&
            entrepreneurs.length > 0
        ) {
            try this.declareWinner() {
                // Winner successfully declared
            } catch {
                // Continue with closing the offer even if winner declaration fails
            }
        }

        isClosed = true;
        emit OfferClosedEvent();
    }

    // ===== View Functions =====

    function getProposalCount() external view returns (uint256) {
        return entrepreneurs.length;
    }

    function getEntrepreneurByIndex(
        uint256 index
    ) external view returns (address) {
        require(index < entrepreneurs.length, "Index out of bounds");
        return entrepreneurs[index];
    }

    function getProposal(
        address entrepreneur
    )
        external
        view
        returns (address, string memory, uint256, uint256, uint256)
    {
        Proposal storage proposal = proposals[entrepreneur];
        if (!proposal.exists) revert ProposalNotFound();

        return (
            proposal.entrepreneur,
            proposal.description,
            proposal.price,
            proposal.totalScore,
            proposal.reviewCount
        );
    }

    function getReviewersCount(
        address entrepreneur
    ) external view returns (uint256) {
        return entrepreneurReviewers[entrepreneur].length;
    }

    function getReviewByExpert(
        address entrepreneur,
        address expert
    ) external view returns (address, uint8) {
        Review storage review = reviews[entrepreneur][expert];
        require(review.exists, "Review not found");

        return (review.expert, review.score);
    }

    function getStage() external view returns (uint8) {
        if (isClosed) return 4; // Closed
        if (block.timestamp < submissionStart) return 0; // Not started
        if (block.timestamp < submissionEnd) return 1; // Submission period
        if (block.timestamp < reviewStart) return 2; // Between submission and review
        if (block.timestamp < reviewEnd) return 3; // Review period
        return 4; // Ended (after review period)
    }
}
