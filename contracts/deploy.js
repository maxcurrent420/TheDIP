// Deployment script for DIP game contracts
// Run with: npx hardhat run scripts/deploy.js --network <network>

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get contract factories
  const DIPToken = await ethers.getContractFactory("DIPToken");
  const PowerNFT = await ethers.getContractFactory("PowerNFT");
  const PowerMarketplace = await ethers.getContractFactory("PowerMarketplace");
  const GameContract = await ethers.getContractFactory("GameContract");

  // Deploy DIP Token with initial supply of 10 million
  console.log("Deploying DIP Token...");
  const dipToken = await DIPToken.deploy(10000000);
  await dipToken.deployed();
  console.log("DIP Token deployed to:", dipToken.address);

  // Deploy Power NFT
  console.log("Deploying Power NFT...");
  const powerNFT = await PowerNFT.deploy();
  await powerNFT.deployed();
  console.log("Power NFT deployed to:", powerNFT.address);

  // Deploy Power Marketplace
  console.log("Deploying Power Marketplace...");
  const powerMarketplace = await PowerMarketplace.deploy(dipToken.address, powerNFT.address);
  await powerMarketplace.deployed();
  console.log("Power Marketplace deployed to:", powerMarketplace.address);

  // Set base URI for the metadata
  const baseTokenURI = "https://dimensional-patrol-api.com/metadata/";

  // Deploy Game Contract
  console.log("Deploying Game Contract...");
  const gameContract = await GameContract.deploy(dipToken.address, powerNFT.address, baseTokenURI);
  await gameContract.deployed();
  console.log("Game Contract deployed to:", gameContract.address);

  // Set permissions
  console.log("Setting contract permissions...");
  
  // Set game contract as authorized minter in DIP Token
  const setGameContractTx = await dipToken.setGameContract(gameContract.address);
  await setGameContractTx.wait();
  console.log("Set game contract as authorized minter in DIP Token");
  
  // Set game contract in Power NFT
  const setNftGameContractTx = await powerNFT.setGameContract(gameContract.address);
  await setNftGameContractTx.wait();
  console.log("Set game contract in Power NFT");

  console.log("Deployment complete!");
  console.log("----------------------------------------------------");
  console.log("DIP Token:", dipToken.address);
  console.log("Power NFT:", powerNFT.address);
  console.log("Power Marketplace:", powerMarketplace.address);
  console.log("Game Contract:", gameContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
