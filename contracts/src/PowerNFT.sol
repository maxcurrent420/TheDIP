// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PowerNFT
 * @dev ERC721 contract for game power-up NFTs
 */
contract PowerNFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Game contract address that can mint NFTs
    address public gameContractAddress;
    
    // Power NFT metadata
    struct PowerMetadata {
        string powerType;
        uint256 level;
        uint256 rarity;
        bool enhanced;
    }
    
    // Mapping from token ID to power metadata
    mapping(uint256 => PowerMetadata) public powerMetadata;
    
    // Events
    event GameContractChanged(address indexed previousAddress, address indexed newAddress);
    event PowerMinted(uint256 indexed tokenId, address indexed owner, string powerType);
    event PowerFused(uint256 indexed tokenId, string powerType1, string powerType2, string newPowerType);
    
    /**
     * @dev Constructor
     */
    constructor() ERC721("Dimensional Power", "DIPWR") Ownable(msg.sender) {}
    
    /**
     * @dev Set the game contract address that can mint NFTs
     * @param _gameContractAddress Address of the game contract
     */
    function setGameContract(address _gameContractAddress) external onlyOwner {
        emit GameContractChanged(gameContractAddress, _gameContractAddress);
        gameContractAddress = _gameContractAddress;
    }
    
    /**
     * @dev Mint a new power NFT
     * @param to Address to mint the NFT to
     * @param powerType Type of power
     * @param level Power level
     * @param rarity Power rarity
     * @param tokenURI Token URI for metadata
     * @return The new token ID
     */
    function mintPower(
        address to,
        string memory powerType,
        uint256 level,
        uint256 rarity,
        string memory tokenURI
    ) external returns (uint256) {
        require(
            msg.sender == gameContractAddress || msg.sender == owner(),
            "Only game contract or owner can mint powers"
        );
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Set power metadata
        powerMetadata[newTokenId] = PowerMetadata({
            powerType: powerType,
            level: level,
            rarity: rarity,
            enhanced: false
        });
        
        emit PowerMinted(newTokenId, to, powerType);
        
        return newTokenId;
    }
    
    /**
     * @dev Create a new enhanced power NFT from two existing powers
     * @param owner Address that owns the powers
     * @param tokenId1 First power token ID
     * @param tokenId2 Second power token ID
     * @param newPowerType Type of the new enhanced power
     * @param tokenURI Token URI for metadata
     * @return The new token ID
     */
    function fusePowers(
        address owner,
        uint256 tokenId1,
        uint256 tokenId2,
        string memory newPowerType,
        string memory tokenURI
    ) external returns (uint256) {
        require(
            msg.sender == gameContractAddress || msg.sender == owner(),
            "Only game contract or owner can fuse powers"
        );
        require(
            ownerOf(tokenId1) == owner && ownerOf(tokenId2) == owner,
            "Owner must own both powers"
        );
        
        // Get existing power types
        string memory powerType1 = powerMetadata[tokenId1].powerType;
        string memory powerType2 = powerMetadata[tokenId2].powerType;
        
        // Calculate new level and rarity (average + bonus)
        uint256 newLevel = (powerMetadata[tokenId1].level + powerMetadata[tokenId2].level) / 2 + 1;
        uint256 newRarity = (powerMetadata[tokenId1].rarity + powerMetadata[tokenId2].rarity) / 2 + 1;
        
        // Burn the original powers
        _burn(tokenId1);
        _burn(tokenId2);
        
        // Mint new enhanced power
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(owner, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Set enhanced power metadata
        powerMetadata[newTokenId] = PowerMetadata({
            powerType: newPowerType,
            level: newLevel,
            rarity: newRarity,
            enhanced: true
        });
        
        emit PowerFused(newTokenId, powerType1, powerType2, newPowerType);
        
        return newTokenId;
    }
    
    /**
     * @dev Get power metadata
     * @param tokenId Token ID
     * @return Power metadata
     */
    function getPowerMetadata(uint256 tokenId) external view returns (PowerMetadata memory) {
        require(_exists(tokenId), "Power does not exist");
        return powerMetadata[tokenId];
    }
    
    // Override functions to make ERC721Enumerable and ERC721URIStorage work together
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
