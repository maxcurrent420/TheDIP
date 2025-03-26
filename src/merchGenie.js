// MerchGenie kiosk module
import { KIOSK_INTERACTION_DISTANCE, POWER_FUSION_COST, POWER_NFT_CONVERSION_COST } from './constants.js';

/**
 * MerchGenie kiosk class - Handles in-game marketplace functionality
 */
export class MerchGenie {
  constructor(THREE, scene, gameState, web3Manager) {
    this.THREE = THREE;
    this.scene = scene;
    this.gameState = gameState;
    this.web3Manager = web3Manager;
    this.kiosks = [];
    this.activeKiosk = null;
    
    // Initialize methods if they don't exist
    this.createKiosk = this.createKiosk || function(){};
    this.spawnKiosks = this.spawnKiosks || function(){};
    this.checkKioskInteraction = this.checkKioskInteraction || function(){};
    this.showKioskMenu = this.showKioskMenu || function(){};
    this.hideKioskMenu = this.hideKioskMenu || function(){};
    this.performTransaction = this.performTransaction || function(){};
    this.updateKioskMenu = this.updateKioskMenu || function(){};
    
    // Bind methods
    this.createKiosk = this.createKiosk.bind(this);
    this.spawnKiosks = this.spawnKiosks.bind(this);
    this.checkKioskInteraction = this.checkKioskInteraction.bind(this);
    this.showKioskMenu = this.showKioskMenu.bind(this);
    this.hideKioskMenu = this.hideKioskMenu.bind(this);
    this.performTransaction = this.performTransaction.bind(this);
    this.updateKioskMenu = this.updateKioskMenu.bind(this);
  }
  
  /**
   * Create a MerchGenie kiosk
   * @param {THREE.Vector3} position - Kiosk position
   * @returns {THREE.Group} Kiosk group
   */
  createKiosk(position) {
    // Create a group to hold all kiosk elements
    const kioskGroup = new this.THREE.Group();
    
    // Create the kiosk base
    const baseGeometry = new this.THREE.BoxGeometry(2, 0.1, 2);
    const baseMaterial = new this.THREE.MeshLambertMaterial({ color: 0x3355aa });
    const base = new this.THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.05;
    kioskGroup.add(base);
    
    // Create the kiosk pedestal
    const pedestalGeometry = new this.THREE.BoxGeometry(1.5, 1.2, 1.5);
    const pedestalMaterial = new this.THREE.MeshLambertMaterial({ color: 0x4477cc });
    const pedestal = new this.THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.y = 0.7;
    kioskGroup.add(pedestal);
    
    // Create the kiosk top
    const topGeometry = new this.THREE.BoxGeometry(1.8, 0.1, 1.8);
    const topMaterial = new this.THREE.MeshLambertMaterial({ color: 0x3355aa });
    const top = new this.THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.35;
    kioskGroup.add(top);
    
    // Create a holographic display
    const displayGeometry = new this.THREE.BoxGeometry(1, 0.8, 0.1);
    const displayMaterial = new this.THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.7
    });
    const display = new this.THREE.Mesh(displayGeometry, displayMaterial);
    display.position.set(0, 1.8, 0);
    kioskGroup.add(display);
    
    // Create the "MerchGenie" text
    const textGeometry = new this.THREE.PlaneGeometry(0.8, 0.2);
    const textMaterial = new this.THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const text = new this.THREE.Mesh(textGeometry, textMaterial);
    text.position.set(0, 1.5, 0.76);
    kioskGroup.add(text);
    
    // Create a holographic power display that rotates
    const powerGeometry = new this.THREE.SphereGeometry(0.25, 16, 16);
    const powerMaterial = new this.THREE.MeshBasicMaterial({
      color: 0xff77aa,
      transparent: true,
      opacity: 0.8
    });
    const powerDisplay = new this.THREE.Mesh(powerGeometry, powerMaterial);
    powerDisplay.position.set(0, 2.2, 0);
    kioskGroup.userData.powerDisplay = powerDisplay;
    kioskGroup.add(powerDisplay);
    
    // Add floating DIP token symbol
    const tokenGeometry = new this.THREE.CylinderGeometry(0.1, 0.1, 0.02, 16);
    const tokenMaterial = new this.THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const token = new this.THREE.Mesh(tokenGeometry, tokenMaterial);
    token.position.set(0.5, 1.9, 0.3);
    token.rotation.x = Math.PI / 2;
    token.userData.floatDirection = 0.002;
    token.userData.rotationSpeed = 0.02;
    kioskGroup.userData.token = token;
    kioskGroup.add(token);
    
    // Set kiosk position
    kioskGroup.position.copy(position);
    
    // Add user data
    kioskGroup.userData.type = 'merchGenieKiosk';
    kioskGroup.userData.isActive = false;
    kioskGroup.userData.rotationSpeed = 0.01;
    
    // Add to level objects
    this.scene.add(kioskGroup);
    this.gameState.levelObjects.push(kioskGroup);
    this.kiosks.push(kioskGroup);
    
    console.log(`Created MerchGenie kiosk at position: x=${position.x}, y=${position.y}, z=${position.z}`);
    
    return kioskGroup;
  }
  
  /**
   * Spawn MerchGenie kiosks in the level
   * @param {number} count - Number of kiosks to spawn
   * @param {number} levelSize - Size of the level
   */
  spawnKiosks(count, levelSize) {
    const existingCount = this.kiosks.length;
    const newCount = Math.max(0, count - existingCount);
    
    console.log(`Spawning ${newCount} new MerchGenie kiosks (${existingCount} already exist)`);
    
    for (let i = 0; i < newCount; i++) {
      // Generate random position but avoid center (player spawn)
      let x, z;
      do {
        x = (Math.random() * (levelSize - 6)) - ((levelSize - 6) / 2);
        z = (Math.random() * (levelSize - 6)) - ((levelSize - 6) / 2);
      } while (Math.abs(x) < 10 && Math.abs(z) < 10);
      
      // Create kiosk
      this.createKiosk(new this.THREE.Vector3(x, 0, z));
    }
  }
  
  /**
   * Update kiosks (animations, etc.)
   * @param {number} deltaTime - Time since last frame
   */
  updateKiosks(deltaTime) {
    this.kiosks.forEach(kiosk => {
      // Rotate power display
      if (kiosk.userData.powerDisplay) {
        kiosk.userData.powerDisplay.rotation.y += kiosk.userData.rotationSpeed;
      }
      
      // Float and rotate token
      if (kiosk.userData.token) {
        const token = kiosk.userData.token;
        
        // Floating animation
        token.position.y += token.userData.floatDirection;
        if (token.position.y > 2.0 || token.position.y < 1.8) {
          token.userData.floatDirection *= -1;
        }
        
        // Rotation animation
        token.rotation.z += token.userData.rotationSpeed;
      }
    });
  }
  
  /**
   * Check for player interaction with kiosks
   * @param {THREE.Vector3} playerPosition - Player position
   * @returns {boolean} Whether interaction occurred
   */
  checkKioskInteraction(playerPosition) {
    // First check if the player moved away from active kiosk
    if (this.activeKiosk) {
      const distance = playerPosition.distanceTo(this.activeKiosk.position);
      if (distance > KIOSK_INTERACTION_DISTANCE) {
        this.hideKioskMenu();
        return false;
      }
    }
    
    // Check for new interactions
    for (const kiosk of this.kiosks) {
      const distance = playerPosition.distanceTo(kiosk.position);
      
      if (distance <= KIOSK_INTERACTION_DISTANCE) {
        // If this is a different kiosk than the active one
        if (this.activeKiosk !== kiosk) {
          // Hide previous menu if any
          if (this.activeKiosk) {
            this.hideKioskMenu();
          }
          
          // Show this kiosk's menu
          this.showKioskMenu(kiosk);
          return true;
        }
        
        // Already interacting with this kiosk
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Show the kiosk menu
   * @param {THREE.Group} kiosk - Kiosk to interact with
   */
  showKioskMenu(kiosk) {
    // Set active kiosk
    this.activeKiosk = kiosk;
    kiosk.userData.isActive = true;
    
    // Get the kiosk menu element
    const kioskMenu = document.getElementById('kioskMenu');
    if (!kioskMenu) {
      console.error('Kiosk menu element not found');
      return;
    }
    
    // Pause the game while menu is open
    this.gameState.paused = true;
    
    // Update menu contents
    this.updateKioskMenu();
    
    // Show the menu
    kioskMenu.style.display = 'flex';
    
    // Show message
    this.gameState.showWardenMessage('Welcome to MerchGenie! Spend your DIP tokens here.');
    
    console.log('Kiosk menu shown');
  }
  
  /**
   * Hide the kiosk menu
   */
  hideKioskMenu() {
    // Clear active kiosk
    if (this.activeKiosk) {
      this.activeKiosk.userData.isActive = false;
      this.activeKiosk = null;
    }
    
    // Get the kiosk menu element
    const kioskMenu = document.getElementById('kioskMenu');
    if (!kioskMenu) {
      console.error('Kiosk menu element not found');
      return;
    }
    
    // Hide the menu
    kioskMenu.style.display = 'none';
    
    // Unpause the game when closing the menu
    this.gameState.paused = false;
    
    // Return to gameplay
    if (this.gameState && this.gameState.returnToGameplay) {
      this.gameState.returnToGameplay();
    }
    
    console.log('Kiosk menu hidden');
  }
  
  /**
   * Update the kiosk menu contents
   */
  updateKioskMenu() {
    // Get the kiosk menu elements
    const kioskMenu = document.getElementById('kioskMenu');
    const tokenBalance = document.getElementById('tokenBalance');
    const powersList = document.getElementById('powersList');
    
    if (!kioskMenu || !tokenBalance || !powersList) {
      console.error('Kiosk menu elements not found');
      return;
    }
    
    // Update token balance
    tokenBalance.textContent = this.gameState.dipTokens;
    
    // Clear powers list
    powersList.innerHTML = '';
    
    // Add absorbed powers to the list
    if (this.gameState.absorbedPowers && this.gameState.absorbedPowers.length > 0) {
      this.gameState.absorbedPowers.forEach((power, index) => {
        const powerItem = document.createElement('div');
        powerItem.className = 'power-item';
        
        const powerName = document.createElement('span');
        powerName.textContent = power.type;
        powerItem.appendChild(powerName);
        
        // Add action buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'power-buttons';
        
        // Equip button
        const equipButton = document.createElement('button');
        equipButton.textContent = 'Equip';
        equipButton.addEventListener('click', () => {
          this.equipPower(power);
        });
        buttonsContainer.appendChild(equipButton);
        
        // Convert to NFT button
        const nftButton = document.createElement('button');
        nftButton.textContent = 'Convert to NFT';
        nftButton.addEventListener('click', () => {
          this.convertToNFT(power, index);
        });
        buttonsContainer.appendChild(nftButton);
        
        powerItem.appendChild(buttonsContainer);
        powersList.appendChild(powerItem);
      });
      
      // Add fusion section if at least 2 powers
      if (this.gameState.absorbedPowers.length >= 2) {
        const fusionSection = document.createElement('div');
        fusionSection.className = 'fusion-section';
        
        const fusionTitle = document.createElement('h3');
        fusionTitle.textContent = 'Fuse Powers';
        fusionSection.appendChild(fusionTitle);
        
        const fusionDesc = document.createElement('p');
        fusionDesc.textContent = `Combine two powers for ${POWER_FUSION_COST} DIP tokens`;
        fusionSection.appendChild(fusionDesc);
        
        // Power selection dropdowns
        const selectionContainer = document.createElement('div');
        selectionContainer.className = 'fusion-selection';
        
        // First power dropdown
        const power1Select = document.createElement('select');
        power1Select.id = 'power1Select';
        this.gameState.absorbedPowers.forEach((power, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = power.type;
          power1Select.appendChild(option);
        });
        selectionContainer.appendChild(power1Select);
        
        // Plus symbol
        const plusSymbol = document.createElement('span');
        plusSymbol.textContent = '+';
        plusSymbol.className = 'fusion-plus';
        selectionContainer.appendChild(plusSymbol);
        
        // Second power dropdown
        const power2Select = document.createElement('select');
        power2Select.id = 'power2Select';
        this.gameState.absorbedPowers.forEach((power, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = power.type;
          power2Select.appendChild(option);
        });
        selectionContainer.appendChild(power2Select);
        
        fusionSection.appendChild(selectionContainer);
        
        // Fuse button
        const fuseButton = document.createElement('button');
        fuseButton.textContent = 'Fuse Powers';
        fuseButton.className = 'fuse-button';
        fuseButton.addEventListener('click', () => {
          const power1Index = parseInt(power1Select.value);
          const power2Index = parseInt(power2Select.value);
          
          if (power1Index === power2Index) {
            this.gameState.showWardenMessage('Cannot fuse a power with itself');
            return;
          }
          
          this.fusePowers(power1Index, power2Index);
        });
        fusionSection.appendChild(fuseButton);
        
        powersList.appendChild(fusionSection);
      }
    } else {
      // No powers available
      const noPowers = document.createElement('p');
      noPowers.textContent = 'No absorbed powers available. Defeat enemies to absorb their powers.';
      powersList.appendChild(noPowers);
    }
    
    // Add PowerStone inventory section
    const stoneSection = document.createElement('div');
    stoneSection.className = 'powerstone-section';
    
    const stoneTitle = document.createElement('h3');
    stoneTitle.textContent = 'PowerStone Inventory';
    stoneSection.appendChild(stoneTitle);
    
    if (this.gameState.powerStoneInventory && this.gameState.powerStoneInventory.length > 0) {
      const stonesList = document.createElement('div');
      stonesList.className = 'stones-list';
      
      this.gameState.powerStoneInventory.forEach((stone, index) => {
        const stoneItem = document.createElement('div');
        stoneItem.className = 'stone-item';
        
        // Stone icon/color indicator
        const stoneIcon = document.createElement('span');
        stoneIcon.className = 'stone-icon';
        stoneIcon.textContent = stone.icon || '💎';
        stoneIcon.style.color = `#${stone.color.toString(16).padStart(6, '0')}`;
        stoneItem.appendChild(stoneIcon);
        
        // Stone name and description
        const stoneInfo = document.createElement('div');
        stoneInfo.className = 'stone-info';
        
        const stoneName = document.createElement('span');
        stoneName.className = 'stone-name';
        stoneName.textContent = stone.name;
        stoneInfo.appendChild(stoneName);
        
        const stoneDesc = document.createElement('span');
        stoneDesc.className = 'stone-desc';
        stoneDesc.textContent = stone.effect.description;
        stoneInfo.appendChild(stoneDesc);
        
        stoneItem.appendChild(stoneInfo);
        
        // Equip button for PowerStone
        const equipButton = document.createElement('button');
        equipButton.className = 'equip-stone-button';
        equipButton.textContent = 'Equip';
        equipButton.addEventListener('click', () => {
          this.equipPowerStone(stone);
        });
        stoneItem.appendChild(equipButton);
        
        stonesList.appendChild(stoneItem);
      });
      
      stoneSection.appendChild(stonesList);
    } else {
      // No PowerStones available
      const noStones = document.createElement('p');
      noStones.textContent = 'No PowerStones available. Fuse powers to create PowerStones.';
      stoneSection.appendChild(noStones);
    }
    
    powersList.appendChild(stoneSection);
  }
  
  /**
   * Equip a power
   * @param {Object} power - Power to equip
   */
  equipPower(power) {
    if (!power) return;
    
    // Find an empty slot or replace current power
    let slot = this.gameState.powers.indexOf(null);
    if (slot === -1) {
      // No empty slot, replace current power
      slot = this.gameState.currentPower;
    }
    
    // Equip the power
    this.gameState.powers[slot] = power;
    
    // Update UI
    this.gameState.updatePowerSlots();
    this.gameState.showWardenMessage(`Equipped ${power.type} in slot ${slot + 1}`);
    
    console.log(`Equipped power ${power.type} in slot ${slot + 1}`);
  }
  
  /**
   * Equip a PowerStone
   * @param {Object} stone - PowerStone to equip
   */
  equipPowerStone(stone) {
    if (!stone) return;
    
    // Equip the PowerStone in the dedicated slot
    this.gameState.equippedPowerStone = stone;
    
    // For backward compatibility 
    this.gameState.powerStone = stone;
    
    // Show message
    this.gameState.showWardenMessage(`Equipped ${stone.name} in PowerStone slot`);
    
    // Update UI
    if (this.gameState.uiManager) {
      this.gameState.uiManager.updateHUD();
    }
    
    console.log(`Equipped PowerStone: ${stone.name}`);
  }
  
  /**
   * Convert a power to an NFT
   * @param {Object} power - Power to convert
   * @param {number} index - Index in absorbedPowers array
   */
  async convertToNFT(power, index) {
    if (!power) return;
    
    // Check if Web3 wallet is connected
    if (!this.web3Manager.isConnected) {
      const connected = await this.web3Manager.connectWallet();
      if (!connected) {
        this.gameState.showWardenMessage('Failed to connect wallet. Cannot convert power to NFT.');
        return;
      }
    }
    
    // Check if player has enough DIP tokens
    if (this.gameState.dipTokens < POWER_NFT_CONVERSION_COST) {
      this.gameState.showWardenMessage(`Not enough DIP tokens. Need ${POWER_NFT_CONVERSION_COST} DIP.`);
      return;
    }
    
    // Convert power to NFT
    const result = await this.web3Manager.mintPowerNft(power.type);
    
    if (result.success) {
      // Remove power from absorbed powers
      this.gameState.absorbedPowers.splice(index, 1);
      
      // Update UI
      this.updateKioskMenu();
      this.gameState.showWardenMessage(`Power ${power.type} converted to NFT!`);
      
      console.log(`Converted power ${power.type} to NFT with token ID ${result.tokenId}`);
    } else {
      this.gameState.showWardenMessage(`Failed to convert power: ${result.error}`);
    }
  }
  
  /**
   * Fuse two powers
   * @param {number} power1Index - Index of first power
   * @param {number} power2Index - Index of second power
   */
  async fusePowers(power1Index, power2Index) {
    // Check indices
    if (power1Index === power2Index) {
      this.gameState.showWardenMessage('Cannot fuse a power with itself');
      return;
    }
    
    const power1 = this.gameState.absorbedPowers[power1Index];
    const power2 = this.gameState.absorbedPowers[power2Index];
    
    if (!power1 || !power2) {
      this.gameState.showWardenMessage('Invalid power selection');
      return;
    }
    
    // Check if player has enough DIP tokens
    if (this.gameState.dipTokens < POWER_FUSION_COST) {
      this.gameState.showWardenMessage(`Not enough DIP tokens. Need ${POWER_FUSION_COST} DIP.`);
      return;
    }
    
    // Get the PowerStone combination type
    const { getPowerStoneCombination, powerStoneTypes } = await import('./powerManager.js');
    const stoneType = getPowerStoneCombination(power1.type, power2.type);
    
    if (!stoneType) {
      this.gameState.showWardenMessage('These powers cannot be combined. Try a different combination.');
      return;
    }
    
    // Deduct tokens
    this.gameState.dipTokens -= POWER_FUSION_COST;
    
    // Create PowerStone in inventory
    const newPowerStone = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      type: stoneType,
      ...powerStoneTypes[stoneType]
    };
    
    // Add to inventory
    this.gameState.powerStoneInventory.push(newPowerStone);
    
    // Remove the original powers (remove the higher index first to avoid shifting issues)
    const higherIndex = Math.max(power1Index, power2Index);
    const lowerIndex = Math.min(power1Index, power2Index);
    
    this.gameState.absorbedPowers.splice(higherIndex, 1);
    this.gameState.absorbedPowers.splice(lowerIndex, 1);
    
    // Update UI
    this.updateKioskMenu();
    
    // Show success message
    this.gameState.showWardenMessage(`Successfully created ${powerStoneTypes[stoneType].name}!`);
    
    console.log(`Fused powers ${power1.type} and ${power2.type} to create PowerStone: ${powerStoneTypes[stoneType].name}`);
    
    return true;
  }
  
  /**
   * Reward the player with DIP tokens
   * @param {number} amount - Amount of tokens to reward
   */
  rewardTokens(amount) {
    if (!amount || amount <= 0) return;
    
    this.gameState.dipTokens += amount;
    this.gameState.showWardenMessage(`Gained ${amount} DIP tokens!`);
    
    // Update UI if kiosk menu is open
    if (this.activeKiosk) {
      this.updateKioskMenu();
    }
    
    console.log(`Rewarded ${amount} DIP tokens`);
  }
}

/**
 * Creates a kiosk menu HTML element to be added to the game
 * @returns {HTMLElement} Kiosk menu element
 */
export function createKioskMenuElement() {
  // Create the menu container
  const kioskMenu = document.createElement('div');
  kioskMenu.id = 'kioskMenu';
  kioskMenu.style.display = 'none';
  kioskMenu.style.position = 'absolute';
  kioskMenu.style.top = '50%';
  kioskMenu.style.left = '50%';
  kioskMenu.style.transform = 'translate(-50%, -50%)';
  kioskMenu.style.width = '400px';
  kioskMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  kioskMenu.style.border = '2px solid #4477cc';
  kioskMenu.style.borderRadius = '5px';
  kioskMenu.style.padding = '20px';
  kioskMenu.style.color = 'white';
  kioskMenu.style.fontFamily = 'Arial, sans-serif';
  kioskMenu.style.zIndex = '1000';
  kioskMenu.style.display = 'none';
  kioskMenu.style.flexDirection = 'column';
  
  // Add header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '15px';
  
  const title = document.createElement('h2');
  title.textContent = 'MerchGenie Kiosk';
  title.style.margin = '0';
  title.style.color = '#66ccff';
  
  const balance = document.createElement('div');
  balance.style.display = 'flex';
  balance.style.alignItems = 'center';
  
  const tokenIcon = document.createElement('span');
  tokenIcon.textContent = 'DIP';
  tokenIcon.style.color = '#ffcc00';
  tokenIcon.style.marginRight = '5px';
  tokenIcon.style.fontWeight = 'bold';
  
  const tokenBalanceValue = document.createElement('span');
  tokenBalanceValue.id = 'tokenBalance';
  tokenBalanceValue.textContent = '0';
  
  balance.appendChild(tokenIcon);
  balance.appendChild(tokenBalanceValue);
  
  header.appendChild(title);
  header.appendChild(balance);
  
  kioskMenu.appendChild(header);
  
  // Add divider
  const divider = document.createElement('hr');
  divider.style.border = '1px solid #4477cc';
  divider.style.margin = '10px 0';
  kioskMenu.appendChild(divider);
  
  // Add powers section
  const powersSection = document.createElement('div');
  powersSection.style.marginBottom = '15px';
  
  const powersTitle = document.createElement('h3');
  powersTitle.textContent = 'Absorbed Powers';
  powersTitle.style.margin = '0 0 10px 0';
  powersTitle.style.color = '#ff77aa';
  
  const powersList = document.createElement('div');
  powersList.id = 'powersList';
  powersList.style.maxHeight = '200px';
  powersList.style.overflowY = 'auto';
  
  powersSection.appendChild(powersTitle);
  powersSection.appendChild(powersList);
  
  kioskMenu.appendChild(powersSection);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Return to Game';
  closeButton.style.backgroundColor = '#4477cc';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.padding = '8px 16px';
  closeButton.style.borderRadius = '4px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginTop = '10px';
  closeButton.style.alignSelf = 'center';
  
  closeButton.addEventListener('click', () => {
    kioskMenu.style.display = 'none';
    // Return to gameplay
    if (window.gameState && window.gameState.returnToGameplay) {
      window.gameState.returnToGameplay();
    }
  });
  
  kioskMenu.appendChild(closeButton);
  
  // Add styles for power items
  const style = document.createElement('style');
  style.textContent = `
    .power-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px;
      background-color: rgba(68, 119, 204, 0.2);
      border-radius: 4px;
    }
    
    .power-buttons {
      display: flex;
      gap: 5px;
    }
    
    .power-buttons button {
      background-color: #3355aa;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .power-buttons button:hover {
      background-color: #4477cc;
    }
    
    .fusion-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #4477cc;
    }
    
    .fusion-section h3 {
      margin: 0 0 5px 0;
      color: #ff77aa;
    }
    
    .fusion-section p {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    
    .fusion-selection {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .fusion-plus {
      margin: 0 10px;
      font-weight: bold;
      font-size: 18px;
    }
    
    .fusion-selection select {
      padding: 4px;
      background-color: #222;
      color: white;
      border: 1px solid #4477cc;
      border-radius: 3px;
    }
    
    .fuse-button {
      background-color: #ff77aa;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    }
    
    .fuse-button:hover {
      background-color: #ff99bb;
    }
    
    .powerstone-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #4477cc;
    }
    
    .powerstone-section h3 {
      margin: 0 0 10px 0;
      color: #ff77aa;
    }
    
    .stones-list {
      max-height: 180px;
      overflow-y: auto;
      margin-bottom: 10px;
    }
    
    .stone-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px;
      background-color: rgba(68, 119, 204, 0.2);
      border-radius: 4px;
    }
    
    .stone-icon {
      font-size: 18px;
      margin-right: 8px;
      filter: drop-shadow(0 0 3px currentColor);
    }
    
    .stone-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .stone-name {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .stone-desc {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .equip-stone-button {
      background-color: #ff77aa;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      margin-left: 10px;
    }
    
    .equip-stone-button:hover {
      background-color: #ff99bb;
    }
  `;
  
  document.head.appendChild(style);
  
  return kioskMenu;
}
