// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PowerNFT.sol";
import "./DIPToken.sol";

/**
 * @title PowerMarketplace
 * @dev Marketplace for trading power NFTs using DIP tokens
 */
contract PowerMarketplace is ReentrancyGuard, Ownable {
    // DIP token contract
    DIPToken public dipToken;
    
    // Power NFT contract
    PowerNFT public powerNFT;
    
    // Fee percentage (in basis points, 1 = 0.01%)
    uint256 public feePercentage = 250; // 2.5%
    
    // Listing structure
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price; // Price in DIP tokens
        bool active;
    }
    
    // Mapping from token ID to its listing
    mapping(uint256 => Listing) public listings;
    
    // Marketplace stats
    uint256 public totalListings;
    uint256 public activeTradingVolume;
    uint256 public totalFeeCollected;
    
    // Events
    event PowerListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event PowerSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event FeePercentageChanged(uint256 previousFee, uint256 newFee);
    
    /**
     * @dev Constructor
     * @param _dipToken DIP token contract address
     * @param _powerNFT Power NFT contract address
     */
    constructor(address _dipToken, address _powerNFT) Ownable(msg.sender) {
        dipToken = DIPToken(_dipToken);
        powerNFT = PowerNFT(_powerNFT);
    }
    
    /**
     * @dev Change the marketplace fee percentage
     * @param _feePercentage New fee percentage (in basis points)
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee percentage cannot exceed 10%");
        emit FeePercentageChanged(feePercentage, _feePercentage);
        feePercentage = _feePercentage;
    }
    
    /**
     * @dev List a power NFT for sale
     * @param tokenId Token ID of the power to list
     * @param price Price in DIP tokens
     */
    function listPower(uint256 tokenId, uint256 price) external {
        require(powerNFT.ownerOf(tokenId) == msg.sender, "You don't own this power");
        require(price > 0, "Price must be greater than zero");
        require(!listings[tokenId].active, "Power already listed");
        
        // Transfer NFT to marketplace contract
        powerNFT.transferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        listings[tokenId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        totalListings++;
        
        emit PowerListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy a listed power NFT
     * @param tokenId Token ID of the power to buy
     */
    function buyPower(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Power not listed for sale");
        
        address buyer = msg.sender;
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Calculate fee
        uint256 fee = (price * feePercentage) / 10000;
        uint256 sellerAmount = price - fee;
        
        // Mark listing as inactive
        listings[tokenId].active = false;
        
        // Transfer DIP tokens from buyer to seller and fee to marketplace owner
        dipToken.transferFrom(buyer, seller, sellerAmount);
        dipToken.transferFrom(buyer, owner(), fee);
        
        // Transfer NFT to buyer
        powerNFT.transferFrom(address(this), buyer, tokenId);
        
        // Update stats
        activeTradingVolume += price;
        totalFeeCollected += fee;
        
        emit PowerSold(tokenId, seller, buyer, price);
    }
    
    /**
     * @dev Cancel a power listing
     * @param tokenId Token ID of the power listing to cancel
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Power not listed for sale");
        require(listing.seller == msg.sender, "Only the seller can cancel the listing");
        
        // Mark listing as inactive
        listings[tokenId].active = false;
        
        // Transfer NFT back to seller
        powerNFT.transferFrom(address(this), msg.sender, tokenId);
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Get all active listings
     * @return Array of active listings
     */
    function getActiveListings() external view returns (Listing[] memory) {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= powerNFT.totalSupply(); i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        // Create result array
        Listing[] memory activeListings = new Listing[](activeCount);
        
        // Fill array
        uint256 index = 0;
        for (uint256 i = 1; i <= powerNFT.totalSupply(); i++) {
            if (listings[i].active) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }
    
    /**
     * @dev Get a seller's active listings
     * @param seller Seller address
     * @return Array of seller's active listings
     */
    function getSellerListings(address seller) external view returns (Listing[] memory) {
        // Count seller's active listings
        uint256 sellerListingCount = 0;
        for (uint256 i = 1; i <= powerNFT.totalSupply(); i++) {
            if (listings[i].active && listings[i].seller == seller) {
                sellerListingCount++;
            }
        }
        
        // Create result array
        Listing[] memory sellerListings = new Listing[](sellerListingCount);
        
        // Fill array
        uint256 index = 0;
        for (uint256 i = 1; i <= powerNFT.totalSupply(); i++) {
            if (listings[i].active && listings[i].seller == seller) {
                sellerListings[index] = listings[i];
                index++;
            }
        }
        
        return sellerListings;
    }
}
