# Dimensional Interceptor Patrol - Smart Contracts

This directory contains the smart contracts for the Dimensional Interceptor Patrol (DIP) game's blockchain integration.

## Contracts Overview

### DIPToken.sol
An ERC20 token implementation that represents the Dimensional Integrity Protocol (DIP) token. These tokens are earned through gameplay and can be used to:
- Convert absorbed powers to NFTs
- Fuse powers to create enhanced powers
- Trade for rare powers in the marketplace

### PowerNFT.sol
An ERC721 (NFT) implementation that represents power-ups in the game. Players can convert their absorbed powers into tradable NFTs that can be used in-game or traded with other players.

### PowerMarketplace.sol
A marketplace contract that enables players to list and trade their Power NFTs for DIP tokens.

### GameContract.sol
The main interface between the game and the blockchain. This contract manages:
- Rewarding players with DIP tokens
- Converting powers to NFTs
- Fusing powers to create enhanced versions
- Managing permissions for game administrators

## Token System: "The DIP" (Dimensional Integrity Protocol)

- **Utility**: Used to buy special items and combine powers to create enhanced absorbed powers, as well as NFTs that confer special benefits/privileges.
- **Power NFTs**: Rare or unique powers can be converted to NFTs and traded using DIP tokens.
- **Storyline Integration**: The DIP token represents stabilized dimensional energy that helps maintain multiverse integrity.

## Development and Deployment

These contracts are designed to be deployed on Ethereum-compatible networks. The deployment script (`deploy.js`) can be used to deploy all contracts with the proper configurations.

### Prerequisites
- Node.js and npm installed
- Hardhat or Truffle for development and testing
- Access to an Ethereum node or a service like Infura

### Deployment Steps
1. Install dependencies: `npm install`
2. Configure the network in hardhat.config.js
3. Run the deployment script: `npx hardhat run deploy.js --network <network_name>`

## Integration with the Game

The game interacts with these contracts through the Web3Manager module, which provides a simplified interface for:
- Connecting wallets
- Checking DIP token balances
- Minting Power NFTs
- Trading powers
- Fusing powers

## Security Considerations

- All contracts include access control to ensure only authorized addresses can perform sensitive operations
- The contracts follow the checked-effects-interactions pattern to prevent reentrancy attacks
- Administrative functions are protected by onlyOwner or onlyAdmin modifiers

## License

All contracts are released under the MIT License.
