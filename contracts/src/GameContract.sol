// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./DIPToken.sol";
import "./PowerNFT.sol";

/**
 * @title GameContract
 * @dev Manages the interface between the game and the blockchain
 */
contract GameContract is Ownable, Pausable {
    // Contract references
    DIPToken public dipToken;
    PowerNFT public powerNFT;
    
    // Game administrator addresses (can issue rewards)
    mapping(address => bool) public gameAdmins;
    
    // Token constants
    uint256 public constant TOKEN_REWARD_PER_LEVEL = 100;
    uint256 public constant TOKEN_REWARD_PER_ENEMY = 10;
    uint256 public constant POWER_NFT_CONVERSION_COST = 500;
    uint256 public constant POWER_FUSION_COST = 300;
    
    // Power rarity levels (1-10)
    uint256 public constant COMMON_RARITY = 1;
    uint256 public constant UNCOMMON_RARITY = 3;
    uint256 public constant RARE_RARITY = 6;
    uint256 public constant EPIC_RARITY = 8;
    uint256 public constant LEGENDARY_RARITY = 10;
    
    // Base URI for token metadata
    string public baseTokenURI;
    
    // Events
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event TokensRewarded(address indexed player, uint256 amount, string reason);
    event PowerMinted(address indexed player, string powerType, uint256 tokenId);
    event PowersFused(address indexed player, string powerType1, string powerType2, string newPowerType, uint256 tokenId);
    event BaseURIChanged(string newBaseURI);
    
    /**
     * @dev Constructor
     * @param _dipToken DIP token contract address
     * @param _powerNFT Power NFT contract address
     * @param _baseTokenURI Base URI for token metadata
     */
    constructor(address _dipToken, address _powerNFT, string memory _baseTokenURI) Ownable(msg.sender) {
        dipToken = DIPToken(_dipToken);
        powerNFT = PowerNFT(_powerNFT);
        baseTokenURI = _baseTokenURI;
        
        // Add deployer as admin
        gameAdmins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }
    
    /**
     * @dev Modifier to check if caller is a game admin
     */
    modifier onlyAdmin() {
        require(gameAdmins[msg.sender] || msg.sender == owner(), "Caller is not a game admin");
        _;
    }
    
    /**
     * @dev Add a new game admin
     * @param admin Address to add as admin
     */
    function addGameAdmin(address admin) external onlyOwner {
        require(!gameAdmins[admin], "Address is already an admin");
        gameAdmins[admin] = true;
        emit AdminAdded(admin);
    }
    
    /**
     * @dev Remove a game admin
     * @param admin Address to remove as admin
     */
    function removeGameAdmin(address admin) external onlyOwner {
        require(gameAdmins[admin], "Address is not an admin");
        gameAdmins[admin] = false;
        emit AdminRemoved(admin);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Set base token URI
     * @param _baseTokenURI New base token URI
     */
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
        emit BaseURIChanged(_baseTokenURI);
    }
    
    /**
     * @dev Reward a player with DIP tokens
     * @param player Player address
     * @param amount Amount of tokens to reward
     * @param reason Reason for reward (e.g., "level_complete", "enemy_defeated")
     */
    function rewardTokens(address player, uint256 amount, string memory reason) external onlyAdmin whenNotPaused {
        require(player != address(0), "Invalid player address");
        require(amount > 0, "Amount must be greater than zero");
        
        dipToken.mintReward(player, amount);
        
        emit TokensRewarded(player, amount, reason);
    }
    
    /**
     * @dev Reward tokens for completing a level
     * @param player Player address
     * @param level Level number
     */
    function rewardForLevelComplete(address player, uint256 level) external onlyAdmin whenNotPaused {
        require(player != address(0), "Invalid player address");
        require(level > 0, "Level must be greater than zero");
        
        // Reward tokens based on level
        uint256 rewardAmount = TOKEN_REWARD_PER_LEVEL + (level * 10);
        dipToken.mintReward(player, rewardAmount);
        
        emit TokensRewarded(player, rewardAmount, string(abi.encodePacked("level_", toString(level))));
    }
    
    /**
     * @dev Reward tokens for defeating enemies
     * @param player Player address
     * @param enemyCount Number of enemies defeated
     */
    function rewardForEnemiesDefeated(address player, uint256 enemyCount) external onlyAdmin whenNotPaused {
        require(player != address(0), "Invalid player address");
        require(enemyCount > 0, "Enemy count must be greater than zero");
        
        // Reward tokens based on enemy count
        uint256 rewardAmount = TOKEN_REWARD_PER_ENEMY * enemyCount;
        dipToken.mintReward(player, rewardAmount);
        
        emit TokensRewarded(player, rewardAmount, "enemies_defeated");
    }
    
    /**
     * @dev Convert an absorbed power to an NFT
     * @param player Player address
     * @param powerType Type of power
     * @param level Power level
     * @param rarity Power rarity (1-10)
     * @return Token ID of the minted NFT
     */
    function convertPowerToNFT(
        address player,
        string memory powerType,
        uint256 level,
        uint256 rarity
    ) external onlyAdmin whenNotPaused returns (uint256) {
        require(player != address(0), "Invalid player address");
        
        // Burn tokens from player
        dipToken.burnFromGame(player, POWER_NFT_CONVERSION_COST);
        
        // Generate token URI
        string memory tokenURI = string(abi.encodePacked(
            baseTokenURI,
            powerType,
            "_",
            toString(level),
            "_",
            toString(rarity)
        ));
        
        // Mint power NFT
        uint256 tokenId = powerNFT.mintPower(player, powerType, level, rarity, tokenURI);
        
        emit PowerMinted(player, powerType, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Fuse two powers to create an enhanced power
     * @param player Player address
     * @param powerType1 First power type
     * @param powerType2 Second power type
     * @param tokenId1 First power token ID
     * @param tokenId2 Second power token ID
     * @return Token ID of the fused power NFT
     */
    function fusePowers(
        address player,
        string memory powerType1,
        string memory powerType2,
        uint256 tokenId1,
        uint256 tokenId2
    ) external onlyAdmin whenNotPaused returns (uint256) {
        require(player != address(0), "Invalid player address");
        
        // Burn tokens from player
        dipToken.burnFromGame(player, POWER_FUSION_COST);
        
        // Generate new power type name
        string memory newPowerType = string(abi.encodePacked(
            "Enhanced_",
            powerType1,
            "_",
            powerType2
        ));
        
        // Get existing power metadata
        PowerNFT.PowerMetadata memory power1 = powerNFT.getPowerMetadata(tokenId1);
        PowerNFT.PowerMetadata memory power2 = powerNFT.getPowerMetadata(tokenId2);
        
        // Generate token URI
        string memory tokenURI = string(abi.encodePacked(
            baseTokenURI,
            "enhanced_",
            powerType1,
            "_",
            powerType2
        ));
        
        // Perform fusion in the NFT contract
        uint256 newTokenId = powerNFT.fusePowers(player, tokenId1, tokenId2, newPowerType, tokenURI);
        
        emit PowersFused(player, powerType1, powerType2, newPowerType, newTokenId);
        
        return newTokenId;
    }
    
    /**
     * @dev Helper function to convert a uint to a string
     * @param value Value to convert
     * @return string representation
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}
