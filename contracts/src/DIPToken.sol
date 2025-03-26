// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DIP Token
 * @dev ERC20 token for the Dimensional Integrity Protocol
 */
contract DIPToken is ERC20, Ownable {
    // Game contract address that can mint tokens
    address public gameContractAddress;
    
    // Events
    event GameContractChanged(address indexed previousAddress, address indexed newAddress);
    
    /**
     * @dev Constructor for the DIP token
     * @param initialSupply Initial supply of tokens to mint to the owner
     */
    constructor(uint256 initialSupply) ERC20("Dimensional Integrity Protocol", "DIP") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }
    
    /**
     * @dev Set the game contract address that can mint tokens
     * @param _gameContractAddress Address of the game contract
     */
    function setGameContract(address _gameContractAddress) external onlyOwner {
        emit GameContractChanged(gameContractAddress, _gameContractAddress);
        gameContractAddress = _gameContractAddress;
    }
    
    /**
     * @dev Mint tokens to a player as rewards
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mintReward(address to, uint256 amount) external {
        require(msg.sender == gameContractAddress || msg.sender == owner(), "Only game contract or owner can mint rewards");
        _mint(to, amount * (10 ** decimals()));
    }
    
    /**
     * @dev Burn tokens for power fusion or other game mechanisms
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFromGame(address from, uint256 amount) external {
        require(msg.sender == gameContractAddress, "Only game contract can burn tokens");
        _burn(from, amount * (10 ** decimals()));
    }
}
