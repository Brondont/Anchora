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
    IOfferFactory public immutable factory;

    // Roles
    bytes32 public constant TENDER_ROLE = keccak256("TENDER_ROLE");
    bytes32 public constant EXPERT_ROLE = keccak256("EXPERT_ROLE");
    bytes32 public constant ENTREPRENEUR_ROLE = keccak256("ENTREPRENEUR_ROLE");

    // Stage enum stored as uint8
    enum Stage {
        Created,
        Open,
        Closed,
        Evaluating,
        Ended
    }
    Stage public stage;

    // Immutable tender address
    address public immutable tender;

    struct Proposal {
        address entrepreneur;
        string uri;
        mapping(address => uint8) scores;
        uint16 totalScore;
    }

    mapping(address => Proposal) private proposals;
    address[] private entrants;

    event ProposalSubmitted(address indexed entrepreneur, string uri);
    event ScoreSubmitted(
        address indexed expert,
        address indexed entrepreneur,
        uint8 score
    );
    event StageAdvanced(Stage newStage);

    constructor(address _tender, address _factory) {
        tender = _tender;
        stage = Stage.Created;
        factory = IOfferFactory(_factory);
    }

    // Override hasRole to check with the factory
    function hasRole(
        bytes32 role,
        address account
    ) public view override returns (bool) {
        if (role == DEFAULT_ADMIN_ROLE && account == tender) {
            return true; // Tender is always admin of this contract
        }
        return factory.hasRole(role, account);
    }

    modifier onlyTender() {
        if (msg.sender != tender) revert Unauthorized();
        _;
    }

    function advanceStage() external onlyTender {
        uint8 next = uint8(stage) + 1;
        if (next > uint8(Stage.Ended)) revert InvalidStage(uint8(stage));
        stage = Stage(next);
        emit StageAdvanced(stage);
    }

    function submitProposal(string calldata uri) external {
        if (!hasRole(ENTREPRENEUR_ROLE, msg.sender)) revert Unauthorized();
        if (stage != Stage.Open) revert InvalidStage(uint8(stage));

        Proposal storage p = proposals[msg.sender];
        // Check that entrepreneur hasn't already submitted
        if (p.entrepreneur != address(0)) {
            revert ProposalAlreadySubmitted();
        }

        p.entrepreneur = msg.sender;
        p.uri = uri;
        entrants.push(msg.sender);
        emit ProposalSubmitted(msg.sender, uri);
    }

    function submitScore(address entrepreneur, uint8 score) external {
        if (!hasRole(EXPERT_ROLE, msg.sender)) revert Unauthorized();
        if (stage != Stage.Evaluating) revert InvalidStage(uint8(stage));
        if (score < 1 || score > 10) revert InvalidScore(score);

        Proposal storage p = proposals[entrepreneur];
        if (p.entrepreneur == address(0)) revert NoProposal(entrepreneur);
        if (p.scores[msg.sender] != 0) revert AlreadyScored(msg.sender);

        p.scores[msg.sender] = score;
        p.totalScore += score;
        emit ScoreSubmitted(msg.sender, entrepreneur, score);
    }

    function selectWinner() external view onlyTender returns (address winner) {
        if (stage != Stage.Ended) revert InvalidStage(uint8(stage));

        uint256 bestScore;
        uint256 len = entrants.length;

        for (uint256 i = 0; i < len; ) {
            address e = entrants[i];
            uint16 s = proposals[e].totalScore;
            if (s > bestScore) {
                bestScore = s;
                winner = e;
            }
            unchecked {
                ++i;
            }
        }

        return winner;
    }

    // Add function to check if an entrepreneur has already submitted a proposal
    function hasSubmittedProposal(
        address entrepreneur
    ) external view returns (bool) {
        return proposals[entrepreneur].entrepreneur != address(0);
    }

    // Add function to get proposal details
    function getProposal(
        address entrepreneur
    ) external view returns (address, string memory, uint16) {
        Proposal storage p = proposals[entrepreneur];
        return (p.entrepreneur, p.uri, p.totalScore);
    }

    // Add function to check an expert's score for a proposal
    function getExpertScore(
        address expert,
        address entrepreneur
    ) external view returns (uint8) {
        return proposals[entrepreneur].scores[expert];
    }

    // Add function to get all entrants
    function getAllEntrants() external view returns (address[] memory) {
        return entrants;
    }
}
