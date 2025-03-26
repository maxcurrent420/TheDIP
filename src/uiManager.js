// UI Manager module
import { MESSAGE_DURATION, LEVEL_INDICATOR_DURATION, MAX_HEALTH, MAX_AMMO } from './constants.js';
import { powerTypes } from './powerManager.js';

/**
 * UI Manager class
 */
export class UIManager {
  constructor(gameState) {
    this.gameState = gameState;
    
    // Store UI elements
    this.crosshair = null;
    this.healthText = null;
    this.ammoText = null;
    this.levelText = null;
    this.killCounter = null;
    this.dimensionIndicator = null;
    this.wardenMessage = null;
    this.startMenu = null;
    this.instructionsMenu = null;
    this.deathScreen = null;
    
    // Store power slots for UI updates
    this.powerSlots = [];
    this.powerStoneSlot = null;
    
    // Bind methods to this context
    this.createHUD = this.createHUD.bind(this);
    this.updateHUD = this.updateHUD.bind(this);
    this.showWardenMessage = this.showWardenMessage.bind(this);
    this.setupMenuListeners = this.setupMenuListeners.bind(this);
    this.createStartMenu = this.createStartMenu.bind(this);
    this.hideStartMenu = this.hideStartMenu.bind(this);
    this.createInstructionsMenu = this.createInstructionsMenu.bind(this);
    this.createDeathScreen = this.createDeathScreen.bind(this);
    this.hideDeathScreen = this.hideDeathScreen.bind(this);
    this.showLevelIndicator = this.showLevelIndicator.bind(this);
    this.updatePowerSlots = this.updatePowerSlots.bind(this);
    this.updateKillCounter = this.updateKillCounter.bind(this);
    this.updateDimensionIndicator = this.updateDimensionIndicator.bind(this);
    
    // Create UI elements
    this.createUI();
  }
  
  /**
   * Create UI elements
   */
  createUI() {
    // Get container
    const container = document.getElementById('gameContainer');
    
    // Create dimension shift indicator only (rest is in HTML)
    this.createDimensionShiftIndicator(container);
    
    // Store references to UI elements
    this.wardenMessage = document.getElementById('wardenMessage');
    this.levelIndicator = document.getElementById('levelIndicator');
    this.killCounter = document.getElementById('killCounter');
    this.startMenu = document.getElementById('startMenu');
    this.instructionsMenu = document.getElementById('instructionsScreen');
    this.deathScreen = document.getElementById('deathScreen');
    this.dimensionIndicator = document.getElementById('dimensionIndicator');
    this.absorptionIndicator = document.getElementById('absorptionIndicator');
    
    // Create HUD elements if they don't exist yet
    if (!document.getElementById('hud')) {
      this.createHUD(container);
    }
    
    // Get power slots - try both naming conventions to ensure compatibility
    this.powerSlots = [
      document.getElementById('slot1') || document.getElementById('powerSlot0'),
      document.getElementById('slot2') || document.getElementById('powerSlot1'),
      document.getElementById('slot3') || document.getElementById('powerSlot2')
    ];
    
    // Check if any slots are missing, which indicates we need to fix them
    if (!this.powerSlots[0] || !this.powerSlots[1] || !this.powerSlots[2]) {
      console.log("Power slots not found by ID, getting by order in container");
      
      // Try to get by order in container
      const powerSlotsContainer = document.querySelector('#powerBar') || document.querySelector('.power-slots') || document.getElementById('powerSlots');
      if (powerSlotsContainer) {
        const slots = powerSlotsContainer.querySelectorAll('.power-slot:not(.powerstone-slot)');
        for (let i = 0; i < 3 && i < slots.length; i++) {
          this.powerSlots[i] = slots[i];
          // Don't change the IDs - the original HTML IDs are fine
        }
      }
    }
    
    // Get PowerStone slot
    this.powerStoneSlot = document.getElementById('powerStoneSlot');
    if (!this.powerStoneSlot) {
      console.log("PowerStone slot not found by ID, getting by class");
      this.powerStoneSlot = document.querySelector('.powerstone-slot');
    }
    
    console.log("Initialized power slots:", 
      this.powerSlots[0] ? "Slot 1 ✓" : "Slot 1 ✗", 
      this.powerSlots[1] ? "Slot 2 ✓" : "Slot 2 ✗", 
      this.powerSlots[2] ? "Slot 3 ✓" : "Slot 3 ✗", 
      this.powerStoneSlot ? "PowerStone ✓" : "PowerStone ✗"
    );
  }
  
  /**
   * Set up menu button listeners
   * @param {Function} startGame - Function to start the game
   * @param {Function} respawnPlayer - Function to respawn player
   */
  setupMenuListeners(startGame, respawnPlayer) {
    const startButton = document.getElementById('startButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const backButton = document.getElementById('backButton');
    const respawnButton = document.getElementById('respawnButton');
    
    startButton.addEventListener('click', () => {
      this.hideStartMenu();
      startGame();
    });
    
    instructionsButton.addEventListener('click', () => {
      this.startMenu.style.display = 'none';
      this.instructionsMenu.style.display = 'block';
    });
    
    backButton.addEventListener('click', () => {
      this.instructionsMenu.style.display = 'none';
      this.startMenu.style.display = 'flex';
    });
    
    respawnButton.addEventListener('click', respawnPlayer);
  }
  
  /**
   * Show the start menu
   */
  showStartMenu() {
    this.startMenu.style.display = 'flex';
    this.instructionsMenu.style.display = 'none';
    this.deathScreen.style.display = 'none';
  }
  
  /**
   * Hide the start menu
   */
  hideStartMenu() {
    this.startMenu.style.display = 'none';
  }
  
  /**
   * Update HUD elements
   */
  updateHUD() {
    // Update health bar
    const healthFill = document.getElementById('healthFill');
    
    if (healthFill) {
      const healthPercent = (this.gameState.health / MAX_HEALTH) * 100;
      healthFill.style.width = `${healthPercent}%`;
      
      // Update health bar color based on health level
      if (healthPercent > 70) {
        healthFill.style.backgroundColor = '#4caf50'; // Green
      } else if (healthPercent > 30) {
        healthFill.style.backgroundColor = '#ff9800'; // Orange
      } else {
        healthFill.style.backgroundColor = '#f44336'; // Red
      }
    }
    
    // Update energy display
    const energyFill = document.getElementById('ammoFill');
    
    if (energyFill) {
      const energyPercent = (this.gameState.ammo / MAX_AMMO) * 100;
      energyFill.style.width = `${energyPercent}%`;
    }
    
    // Update dimension display
    if (this.dimensionIndicator) {
      this.dimensionIndicator.textContent = `Dimension: ${this.gameState.dimension.toUpperCase()}`;
      
      // Set dimension color based on current dimension
      let dimensionColor = '#ffffff'; // Default white
      switch (this.gameState.dimension) {
        case 'prime':
          dimensionColor = '#4caf50'; // Green
          break;
        case 'void':
          dimensionColor = '#9c27b0'; // Purple
          break;
        case 'nexus':
          dimensionColor = '#2196f3'; // Blue
          break;
        case 'quantum':
          dimensionColor = '#ff9800'; // Orange
          break;
      }
      this.dimensionIndicator.style.color = dimensionColor;
    }
    
    // Update DIP tokens display
    const dipTokens = document.getElementById('dipTokens');
    if (dipTokens && this.gameState.dipTokens !== undefined) {
      dipTokens.textContent = this.gameState.dipTokens;
    }
    
    // Update power slots
    this.updatePowerSlots();
  }
  
  /**
   * Update power slots display
   */
  updatePowerSlots() {
    console.log("Updating power slots: active index=", this.gameState.activePowerIndex, "current power=", this.gameState.currentPower);
    
    // First remove both active and active-power classes from all slots to ensure clean state
    for (let i = 0; i < 3; i++) {
      const slot = this.powerSlots[i];
      if (slot) {
        slot.classList.remove('active-power');
        slot.classList.remove('active');
      }
    }
    if (this.powerStoneSlot) {
      this.powerStoneSlot.classList.remove('active-power');
      this.powerStoneSlot.classList.remove('active');
    }
    
    // Store which power is currently active
    const activeIndex = this.gameState.activePowerIndex !== undefined 
      ? this.gameState.activePowerIndex 
      : this.gameState.currentPower !== undefined 
        ? this.gameState.currentPower 
        : 0;
    
    console.log(`Active power index for UI: ${activeIndex}`);
    
    // Update normal power slots
    for (let i = 0; i < 3; i++) {
      const slot = this.powerSlots[i];
      if (!slot) continue;
      
      const iconEl = slot.querySelector('.power-icon');
      const nameEl = slot.querySelector('.power-name');
      
      if (this.gameState.powers[i]) {
        const power = this.gameState.powers[i];
        // Ensure the icon is properly displayed - directly set the power icon
        if (power.type && power.type in this.gameState.powerTypes) {
          iconEl.textContent = this.gameState.powerTypes[power.type].icon || '❓';
          nameEl.textContent = this.gameState.powerTypes[power.type].name || power.type;
        } else {
          iconEl.textContent = power.icon || '❓';
          nameEl.textContent = power.type || 'Unknown';
        }
        
        slot.classList.add('has-power');
        
        // Add active class ONLY if this is the currently selected power
        if (activeIndex === i) {
          slot.classList.add('active-power');
          slot.classList.add('active');
          console.log(`Adding active classes to slot ${i+1}`);
        }
      } else {
        iconEl.textContent = '❓';
        nameEl.textContent = 'Empty';
        slot.classList.remove('has-power');
      }
    }
    
    // Update PowerStone slot
    if (this.powerStoneSlot) {
      const iconEl = this.powerStoneSlot.querySelector('.power-icon');
      const nameEl = this.powerStoneSlot.querySelector('.power-name');
      
      if (this.gameState.equippedPowerStone) {
        const stone = this.gameState.equippedPowerStone;
        iconEl.textContent = stone.icon || '💎';
        nameEl.textContent = stone.name;
        this.powerStoneSlot.style.borderColor = stone.color || '#6a6aff';
        this.powerStoneSlot.classList.add('has-stone');
        
        // Highlight the PowerStone slot when it's active
        if (activeIndex === 3) {
          this.powerStoneSlot.classList.add('active-power');
          this.powerStoneSlot.classList.add('active');
          console.log("Adding active classes to PowerStone slot");
        }
      } else {
        iconEl.textContent = '💎';
        nameEl.textContent = 'No Stone';
        this.powerStoneSlot.style.borderColor = '#6a6aff';
        this.powerStoneSlot.classList.remove('has-stone');
      }
    }
  }
  
  /**
   * Update kill counter display
   */
  updateKillCounter() {
    if (this.killCounter) {
      this.killCounter.textContent = `${this.gameState.currentKillName}: ${this.gameState.enemiesDefeated}/${this.gameState.levelEnemyCount}`;
    }
  }
  
  /**
   * Show level indicator
   * @param {string} text - Level text
   */
  showLevelIndicator(text) {
    this.levelIndicator.textContent = text;
    this.levelIndicator.style.opacity = '1';
    
    // Hide after delay
    setTimeout(() => {
      this.levelIndicator.style.opacity = '0';
    }, LEVEL_INDICATOR_DURATION);
  }
  
  /**
   * Show a message from The Warden
   * @param {string} message - Message text
   */
  showWardenMessage(message) {
    this.wardenMessage.textContent = message;
    this.wardenMessage.style.opacity = '1';
    
    // Clear existing timeout
    if (this.wardenMessageTimeout) {
      clearTimeout(this.wardenMessageTimeout);
    }
    
    // Hide after delay
    this.wardenMessageTimeout = setTimeout(() => {
      this.wardenMessage.style.opacity = '0';
    }, MESSAGE_DURATION);
  }
  
  /**
   * Show death screen
   * @param {number} totalEnemiesDefeated - Total enemies defeated
   */
  showDeathScreen(totalEnemiesDefeated) {
    const deathMessage = document.getElementById('deathMessage');
    
    this.deathScreen.style.display = 'flex';
    deathMessage.textContent = `You were overwhelmed by the dimensional anomalies.
      Total enemies defeated: ${totalEnemiesDefeated}`;
  }
  
  /**
   * Hide death screen
   */
  hideDeathScreen() {
    this.deathScreen.style.display = 'none';
  }
  
  /**
   * Update dimension indicator
   * @param {string} dimension - Current dimension
   */
  updateDimensionIndicator(dimension) {
    this.dimensionIndicator.textContent = `Dimension: ${dimension.toUpperCase()}`;
  }

  /**
   * Create the HUD elements
   */
  createHUD() {
    // Create HUD container
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.position = 'absolute';
    hud.style.top = '0';
    hud.style.left = '0';
    hud.style.width = '100%';
    hud.style.height = '100%';
    hud.style.pointerEvents = 'none';
    hud.style.display = 'flex';
    hud.style.flexDirection = 'column';
    hud.style.justifyContent = 'space-between';
    hud.style.padding = '20px';
    hud.style.boxSizing = 'border-box';
    hud.style.fontFamily = 'Arial, sans-serif';
    hud.style.color = '#fff';
    hud.style.userSelect = 'none';
    
    // Add CSS styles for power slots
    const style = document.createElement('style');
    style.textContent = `
      .active-power {
        border-color: #ff6600 !important;
        box-shadow: 0 0 10px #ff6600, inset 0 0 5px #ff6600;
        transform: scale(1.05);
        z-index: 10;
      }
      
      .powerSlot {
        transition: all 0.2s ease;
      }
      
      .has-power, .has-stone {
        border-color: #66ccff !important;
      }
    `;
    document.head.appendChild(style);
    
    // Create top HUD section
    const topHUD = document.createElement('div');
    topHUD.style.display = 'flex';
    topHUD.style.justifyContent = 'space-between';
    topHUD.style.alignItems = 'flex-start';
    
    // Create health display
    const healthDisplay = document.createElement('div');
    healthDisplay.style.display = 'flex';
    healthDisplay.style.flexDirection = 'column';
    healthDisplay.style.alignItems = 'flex-start';
    healthDisplay.style.marginBottom = '10px';
    
    const healthLabel = document.createElement('div');
    healthLabel.textContent = 'HEALTH';
    healthLabel.style.fontSize = '14px';
    healthLabel.style.marginBottom = '5px';
    
    const healthBarContainer = document.createElement('div');
    healthBarContainer.style.width = '200px';
    healthBarContainer.style.height = '20px';
    healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    healthBarContainer.style.border = '1px solid #555';
    healthBarContainer.style.borderRadius = '3px';
    healthBarContainer.style.overflow = 'hidden';
    healthBarContainer.style.position = 'relative';
    
    const healthBar = document.createElement('div');
    healthBar.id = 'healthBar';
    healthBar.style.width = '100%';
    healthBar.style.height = '100%';
    healthBar.style.backgroundColor = '#4caf50';
    healthBar.style.transition = 'width 0.3s ease';
    
    const healthValue = document.createElement('div');
    healthValue.id = 'healthValue';
    healthValue.textContent = '100';
    healthValue.style.position = 'absolute';
    healthValue.style.top = '50%';
    healthValue.style.left = '50%';
    healthValue.style.transform = 'translate(-50%, -50%)';
    healthValue.style.color = '#fff';
    healthValue.style.fontWeight = 'bold';
    healthValue.style.textShadow = '1px 1px 1px rgba(0, 0, 0, 0.5)';
    
    healthBarContainer.appendChild(healthBar);
    healthBarContainer.appendChild(healthValue);
    healthDisplay.appendChild(healthLabel);
    healthDisplay.appendChild(healthBarContainer);
    
    // Create energy display
    const energyDisplay = document.createElement('div');
    energyDisplay.style.display = 'flex';
    energyDisplay.style.flexDirection = 'column';
    energyDisplay.style.alignItems = 'flex-start';
    
    const energyLabel = document.createElement('div');
    energyLabel.textContent = 'ENERGY';
    energyLabel.style.fontSize = '14px';
    energyLabel.style.marginBottom = '5px';
    
    const energyBarContainer = document.createElement('div');
    energyBarContainer.style.width = '200px';
    energyBarContainer.style.height = '20px';
    energyBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    energyBarContainer.style.border = '1px solid #555';
    energyBarContainer.style.borderRadius = '3px';
    energyBarContainer.style.overflow = 'hidden';
    energyBarContainer.style.position = 'relative';
    
    const energyBar = document.createElement('div');
    energyBar.id = 'energyBar';
    energyBar.style.width = '100%';
    energyBar.style.height = '100%';
    energyBar.style.backgroundColor = '#2196f3';
    energyBar.style.transition = 'width 0.3s ease';
    
    const energyValue = document.createElement('div');
    energyValue.id = 'energyValue';
    energyValue.textContent = '100';
    energyValue.style.position = 'absolute';
    energyValue.style.top = '50%';
    energyValue.style.left = '50%';
    energyValue.style.transform = 'translate(-50%, -50%)';
    energyValue.style.color = '#fff';
    energyValue.style.fontWeight = 'bold';
    energyValue.style.textShadow = '1px 1px 1px rgba(0, 0, 0, 0.5)';
    
    energyBarContainer.appendChild(energyBar);
    energyBarContainer.appendChild(energyValue);
    energyDisplay.appendChild(energyLabel);
    energyDisplay.appendChild(energyBarContainer);
    
    // Create stats display
    const statsDisplay = document.createElement('div');
    statsDisplay.style.display = 'flex';
    statsDisplay.style.flexDirection = 'column';
    statsDisplay.style.alignItems = 'flex-end';
    
    // Create dimension display
    const dimensionInfo = document.createElement('div');
    dimensionInfo.style.fontSize = '14px';
    dimensionInfo.style.marginBottom = '5px';
    
    const dimensionLabel = document.createElement('span');
    dimensionLabel.textContent = 'DIMENSION: ';
    
    const dimensionDisplay = document.createElement('span');
    dimensionDisplay.id = 'dimensionDisplay';
    dimensionDisplay.textContent = 'PRIME';
    dimensionDisplay.style.fontWeight = 'bold';
    dimensionDisplay.style.color = '#4caf50';
    
    dimensionInfo.appendChild(dimensionLabel);
    dimensionInfo.appendChild(dimensionDisplay);
    
    // Create DIP tokens display
    const tokensInfo = document.createElement('div');
    tokensInfo.style.fontSize = '14px';
    tokensInfo.style.marginBottom = '5px';
    tokensInfo.style.display = 'flex';
    tokensInfo.style.alignItems = 'center';
    
    const tokensLabel = document.createElement('span');
    tokensLabel.textContent = 'DIP TOKENS: ';
    
    const tokensDisplay = document.createElement('span');
    tokensDisplay.id = 'dipTokens';
    tokensDisplay.textContent = '100';
    tokensDisplay.style.fontWeight = 'bold';
    tokensDisplay.style.color = '#ffcc00';
    tokensDisplay.style.marginLeft = '5px';
    
    const tokenIcon = document.createElement('span');
    tokenIcon.textContent = '💠';
    tokenIcon.style.marginLeft = '5px';
    tokenIcon.style.color = '#ffcc00';
    
    tokensInfo.appendChild(tokensLabel);
    tokensInfo.appendChild(tokensDisplay);
    tokensInfo.appendChild(tokenIcon);
    
    // Create kill counter
    const killCounter = document.createElement('div');
    killCounter.id = 'killCounter';
    killCounter.style.fontSize = '14px';
    
    statsDisplay.appendChild(dimensionInfo);
    statsDisplay.appendChild(tokensInfo);
    statsDisplay.appendChild(killCounter);
    
    // Add all elements to top HUD
    const leftSide = document.createElement('div');
    leftSide.appendChild(healthDisplay);
    leftSide.appendChild(energyDisplay);
    
    topHUD.appendChild(leftSide);
    topHUD.appendChild(statsDisplay);
    
    // Create bottom HUD section
    const bottomHUD = document.createElement('div');
    bottomHUD.style.display = 'flex';
    bottomHUD.style.justifyContent = 'center';
    bottomHUD.style.alignItems = 'flex-end';
    
    // Create power slots
    const powerSlots = document.createElement('div');
    powerSlots.id = 'powerSlots';
    powerSlots.className = 'power-slots';
    powerSlots.style.display = 'flex';
    powerSlots.style.justifyContent = 'center';
    powerSlots.style.marginBottom = '20px';
    
    // Create 3 regular power slots
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div');
      slot.id = `powerSlot${i}`;
      slot.classList.add('powerSlot');
      slot.style.width = '50px';
      slot.style.height = '50px';
      slot.style.margin = '0 10px';
      slot.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      slot.style.border = '2px solid #555';
      slot.style.borderRadius = '5px';
      slot.style.display = 'flex';
      slot.style.justifyContent = 'center';
      slot.style.alignItems = 'center';
      slot.style.fontSize = '12px';
      slot.style.position = 'relative';
      
      const keyBind = document.createElement('div');
      keyBind.style.position = 'absolute';
      keyBind.style.top = '-15px';
      keyBind.style.left = '50%';
      keyBind.style.transform = 'translateX(-50%)';
      keyBind.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      keyBind.style.padding = '2px 6px';
      keyBind.style.borderRadius = '3px';
      keyBind.style.fontSize = '10px';
      keyBind.textContent = `${i + 1}`;
      
      const powerIcon = document.createElement('div');
      powerIcon.className = 'power-icon';
      powerIcon.style.fontSize = '18px';
      
      const powerName = document.createElement('div');
      powerName.className = 'power-name';
      powerName.style.position = 'absolute';
      powerName.style.bottom = '-15px';
      powerName.style.left = '50%';
      powerName.style.transform = 'translateX(-50%)';
      powerName.style.fontSize = '10px';
      powerName.style.whiteSpace = 'nowrap';
      powerName.textContent = 'Empty';
      
      slot.appendChild(powerIcon);
      slot.appendChild(powerName);
      slot.appendChild(keyBind);
      
      this.powerSlots[i] = slot;
      powerSlots.appendChild(slot);
    }
    
    // Create PowerStone slot
    const powerStoneSlot = document.createElement('div');
    powerStoneSlot.id = 'powerStoneSlot';
    powerStoneSlot.classList.add('powerSlot', 'powerstone-slot');
    powerStoneSlot.style.width = '60px';
    powerStoneSlot.style.height = '60px';
    powerStoneSlot.style.margin = '0 10px';
    powerStoneSlot.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    powerStoneSlot.style.border = '2px solid #6a6aff';
    powerStoneSlot.style.borderRadius = '50%';
    powerStoneSlot.style.display = 'flex';
    powerStoneSlot.style.justifyContent = 'center';
    powerStoneSlot.style.alignItems = 'center';
    powerStoneSlot.style.fontSize = '12px';
    powerStoneSlot.style.position = 'relative';
    powerStoneSlot.style.marginLeft = '25px';
    
    const keyBind = document.createElement('div');
    keyBind.style.position = 'absolute';
    keyBind.style.top = '-15px';
    keyBind.style.left = '50%';
    keyBind.style.transform = 'translateX(-50%)';
    keyBind.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    keyBind.style.padding = '2px 6px';
    keyBind.style.borderRadius = '3px';
    keyBind.style.fontSize = '10px';
    keyBind.textContent = 'E';
    
    const powerIcon = document.createElement('div');
    powerIcon.className = 'power-icon';
    powerIcon.style.fontSize = '24px';
    powerIcon.textContent = '💎';
    
    const powerName = document.createElement('div');
    powerName.className = 'power-name';
    powerName.style.position = 'absolute';
    powerName.style.bottom = '-15px';
    powerName.style.left = '50%';
    powerName.style.transform = 'translateX(-50%)';
    powerName.style.fontSize = '10px';
    powerName.style.whiteSpace = 'nowrap';
    powerName.textContent = 'No Stone';
    
    powerStoneSlot.appendChild(powerIcon);
    powerStoneSlot.appendChild(powerName);
    powerStoneSlot.appendChild(keyBind);
    
    // Store reference to the power stone slot
    this.powerStoneSlot = powerStoneSlot;
    
    // Create a container for all power slots
    const allPowerSlots = document.createElement('div');
    allPowerSlots.style.display = 'flex';
    allPowerSlots.style.justifyContent = 'center';
    allPowerSlots.style.alignItems = 'center';
    
    allPowerSlots.appendChild(powerSlots);
    allPowerSlots.appendChild(powerStoneSlot);
    
    // Add power slots to the bottom center of the screen
    const powerSlotsContainer = document.createElement('div');
    powerSlotsContainer.style.position = 'absolute';
    powerSlotsContainer.style.bottom = '20px';
    powerSlotsContainer.style.left = '50%';
    powerSlotsContainer.style.transform = 'translateX(-50%)';
    powerSlotsContainer.style.display = 'flex';
    powerSlotsContainer.style.flexDirection = 'column';
    powerSlotsContainer.style.alignItems = 'center';
    
    powerSlotsContainer.appendChild(allPowerSlots);
    
    // Create crosshair
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.position = 'absolute';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.width = '10px';
    crosshair.style.height = '10px';
    crosshair.style.borderRadius = '50%';
    crosshair.style.border = '2px solid rgba(255, 255, 255, 0.7)';
    
    // Create warden message display
    const wardenMessage = document.createElement('div');
    wardenMessage.id = 'wardenMessage';
    wardenMessage.style.position = 'absolute';
    wardenMessage.style.top = '30%';
    wardenMessage.style.left = '50%';
    wardenMessage.style.transform = 'translateX(-50%)';
    wardenMessage.style.textAlign = 'center';
    wardenMessage.style.fontSize = '18px';
    wardenMessage.style.fontWeight = 'bold';
    wardenMessage.style.color = '#66ccff';
    wardenMessage.style.textShadow = '0 0 10px rgba(102, 204, 255, 0.7)';
    wardenMessage.style.maxWidth = '80%';
    wardenMessage.style.padding = '10px';
    wardenMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    wardenMessage.style.borderRadius = '5px';
    wardenMessage.style.opacity = '0';
    wardenMessage.style.transition = 'opacity 0.3s ease';
    
    // Create level indicator
    const levelIndicator = document.createElement('div');
    levelIndicator.id = 'levelIndicator';
    levelIndicator.style.position = 'absolute';
    levelIndicator.style.top = '40%';
    levelIndicator.style.left = '50%';
    levelIndicator.style.transform = 'translateX(-50%)';
    levelIndicator.style.textAlign = 'center';
    levelIndicator.style.fontSize = '32px';
    levelIndicator.style.fontWeight = 'bold';
    levelIndicator.style.color = '#ffffff';
    levelIndicator.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.9)';
    levelIndicator.style.opacity = '0';
    levelIndicator.style.transition = 'opacity 0.5s ease';
    
    // Create absorption indicator
    const absorptionIndicator = document.createElement('div');
    absorptionIndicator.id = 'absorptionIndicator';
    absorptionIndicator.style.position = 'absolute';
    absorptionIndicator.style.bottom = '10%';
    absorptionIndicator.style.left = '50%';
    absorptionIndicator.style.transform = 'translateX(-50%)';
    absorptionIndicator.style.textAlign = 'center';
    absorptionIndicator.style.fontSize = '16px';
    absorptionIndicator.style.fontWeight = 'bold';
    absorptionIndicator.style.color = '#ff55cc';
    absorptionIndicator.style.textShadow = '0 0 10px rgba(255, 85, 204, 0.7)';
    absorptionIndicator.style.opacity = '0';
    absorptionIndicator.style.transition = 'opacity 0.3s ease';
    
    // Add elements to HUD
    hud.appendChild(topHUD);
    hud.appendChild(bottomHUD);
    hud.appendChild(crosshair);
    hud.appendChild(wardenMessage);
    hud.appendChild(levelIndicator);
    hud.appendChild(absorptionIndicator);
    
    return hud;
  }

  /**
   * Create dimension shift indicator
   * @param {HTMLElement} container - Game container
   */
  createDimensionShiftIndicator(container) {
    const indicator = document.createElement('div');
    indicator.id = 'dimensionShiftIndicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '0';
    indicator.style.left = '0';
    indicator.style.width = '100%';
    indicator.style.height = '100%';
    indicator.style.display = 'none';
    indicator.style.flexDirection = 'column';
    indicator.style.justifyContent = 'center';
    indicator.style.alignItems = 'center';
    indicator.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.color = '#fff';
    indicator.style.zIndex = '500';
    indicator.style.pointerEvents = 'none';
    
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = '#fff';
    flash.style.opacity = '0';
    flash.style.transition = 'opacity 0.2s ease';
    
    indicator.appendChild(flash);
    
    container.appendChild(indicator);
  }

  /**
   * Create death screen
   * @param {HTMLElement} container - Game container
   */
  createDeathScreen(container) {
    // Use existing death screen
    // No need to create it since it's already in the HTML
  }

  /**
   * Create instructions menu
   * @param {HTMLElement} container - Game container
   */
  createInstructionsMenu(container) {
    // Use existing instructions menu
    // No need to create it since it's already in the HTML
  }

  /**
   * Create start menu
   * @param {HTMLElement} container - Game container
   */
  createStartMenu(container) {
    // Use existing start menu
    // No need to create it since it's already in the HTML
  }
}
