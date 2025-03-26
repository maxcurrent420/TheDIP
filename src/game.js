// Main game module
import { 
  INITIAL_GAME_STATE, 
  PLAYER_HEIGHT, 
  ENEMY_SPAWN_DISTANCE, 
  DIP_TOKEN_REWARD_PER_ENEMY, 
  DIP_TOKEN_REWARD_PER_LEVEL,
  MAX_AMMO,
  AMMO_REGEN_RATE,
  HUD_UPDATE_INTERVAL,
  PLAYER_RADIUS
} from './constants.js';
import { Player } from './player.js';
import { LevelManager } from './levelManager.js';
import { UIManager } from './uiManager.js';
import { ProjectilePool, powerTypes } from './powerManager.js';
import { updateEnemies, damageEnemy, createHealthPickup, spawnEnemies } from './enemy.js';
import { initTextures, regenerateTextures } from './textureLoader.js';
import { showError } from './utils.js';
import { Web3Manager } from './web3Manager.js';
import { MerchGenie, createKioskMenuElement } from './merchGenie.js';
import { AudioManager, playShootSound } from './audioManager.js';
import { MinimapManager } from './minimapManager.js';

/**
 * Game class
 */
export class Game {
  constructor() {
    // Initialize properties
    this.gameState = Object.assign({}, INITIAL_GAME_STATE);
    
    // Add self-reference to gameState for callbacks
    this.gameState.game = this;
    
    // Track animation state
    this.animating = false;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.player = null;
    this.levelManager = null;
    this.uiManager = null;
    this.projectilePool = null;
    this.audioManager = null;
    this.minimapManager = null;
    this.THREE = null; // Will be set from imported module
    
    // Bind methods
    this.initGame = this.initGame.bind(this);
    this.startGame = this.startGame.bind(this);
    this.animate = this.animate.bind(this);
    this.respawnPlayer = this.respawnPlayer.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.checkCollisions = this.checkCollisions.bind(this);
  }
  
  /**
   * Initialize the game
   */
  async initGame() {
    try {
      // Import Three.js from local package
      const THREE = await import('three');
      this.THREE = THREE;
      
      // Also import PointerLockControls
      const { PointerLockControls } = await import('three/examples/jsm/controls/PointerLockControls.js');
      
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x222222);
      this.scene.fog = new THREE.Fog(0x222222, 0, 50);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.y = PLAYER_HEIGHT;
      
      // Add references to gameState for other modules
      this.gameState.camera = this.camera;
      this.gameState.scene = this.scene;
      this.gameState.enemySpawnDistance = ENEMY_SPAWN_DISTANCE;
      this.gameState.DIP_TOKEN_REWARD_PER_ENEMY = DIP_TOKEN_REWARD_PER_ENEMY;
      this.gameState.DIP_TOKEN_REWARD_PER_LEVEL = DIP_TOKEN_REWARD_PER_LEVEL;
      
      // Make sure powerTypes are available in gameState
      this.gameState.powerTypes = powerTypes;
      
      // Make gameState accessible globally for UI elements
      window.gameState = this.gameState;
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      document.getElementById('gameContainer').appendChild(this.renderer.domElement);
      
      // Store scene reference in DOM for easy access from other modules
      this.renderer.domElement.parentElement.__scene = this.scene;
      
      // Create controls
      this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
      
      // Initialize managers
      this.uiManager = new UIManager(this.gameState);
      this.minimapManager = new MinimapManager(this.gameState);
      
      // Set up UI methods for gameState
      this.gameState.updateHUD = this.uiManager.updateHUD;
      this.gameState.updatePowerSlots = this.uiManager.updatePowerSlots;
      this.gameState.updateKillCounter = this.uiManager.updateKillCounter;
      this.gameState.showLevelIndicator = this.uiManager.showLevelIndicator;
      this.gameState.showWardenMessage = this.uiManager.showWardenMessage;
      this.gameState.updateDimensionIndicator = this.uiManager.updateDimensionIndicator;
      
      // Initialize audio manager
      this.audioManager = new AudioManager();
      this.gameState.audioManager = this.audioManager;
      
      // Set up UI menu listeners
      this.uiManager.setupMenuListeners(this.startGame, this.respawnPlayer);
      
      // Initialize textures - WAIT for textures to load completely
      try {
        await initTextures(THREE);
      } catch (textureError) {
        console.warn("Texture loading had errors, but game will continue with fallbacks:", textureError);
      }
      
      this.gameState.textures = regenerateTextures(this.gameState.dimension);
      
      // Create projectile pool
      this.projectilePool = new ProjectilePool(THREE, this.scene);
      this.gameState.projectilePool = this.projectilePool;
      
      // Create player
      this.player = new Player(this.camera, this.controls, this.gameState, THREE);
      
      // Create level manager
      this.levelManager = new LevelManager(THREE, this.scene, this.gameState);
      this.gameState.nextLevel = this.levelManager.nextLevel;
      this.gameState.regenerateTextures = (dimension) => {
        const textures = regenerateTextures(dimension);
        this.gameState.textures = textures;
        this.levelManager.regenerateTextureObjects();
        return textures;
      };
      this.gameState.applyDimensionEffects = this.levelManager.applyDimensionEffects;
      
      // Initialize Web3 manager and MerchGenie
      this.web3Manager = new Web3Manager(this.gameState);
      this.merchGenie = new MerchGenie(THREE, this.scene, this.gameState, this.web3Manager);
      this.gameState.web3Manager = this.web3Manager;
      this.gameState.merchGenie = this.merchGenie;
      
      // Create kiosk menu element
      const kioskMenu = createKioskMenuElement();
      document.getElementById('gameContainer').appendChild(kioskMenu);
      
      // Initialize levelObjects array if not already initialized
      if (!this.gameState.levelObjects) {
        this.gameState.levelObjects = [];
      }
      
      // Set up enemy damage function
      this.gameState.damageEnemy = (enemy, damage) => {
        return damageEnemy(
          enemy, 
          damage, 
          this.gameState, 
          THREE, 
          this.scene, 
          (threeLib, enemyPosition, sceneArg, levelObjectsArg) => {
            console.log('Game createHealthPickup callback called with position:', enemyPosition);
            
            // The first param is THREE, second is enemyPosition - use them correctly
            return createHealthPickup(threeLib, enemyPosition, this.scene, this.gameState.levelObjects);
          },
          (count, camera, enemies, scene, dimension, levelSize, spawnDistance) => 
            spawnEnemies(THREE, count, camera, enemies, scene, dimension, levelSize, spawnDistance),
          this.gameState.nextLevel,
          this.gameState.updateKillCounter
        );
      };
      
      // Add window resize handler
      window.addEventListener('resize', this.onWindowResize);
      
      // Add pointer lock event listeners
      this.controls.addEventListener('lock', () => {
        this.gameState.paused = false;
      });
      
      this.controls.addEventListener('unlock', () => {
        if (this.gameState.started && this.uiManager.deathScreen.style.display !== 'flex') {
          this.gameState.paused = true;
        }
      });
      
      // Set up a method to return to gameplay from UI interaction
      this.gameState.returnToGameplay = this.returnToGameplay.bind(this);
      
      // Start animation loop
      this.animate();
      
      // Show start menu
      this.uiManager.showStartMenu();
      
    } catch (error) {
      showError("Error initializing game: " + error.message);
      console.error(error);
    }
  }
  
  /**
   * Start the game
   */
  startGame() {
    // Lock pointer
    this.controls.lock();
    
    // Set game state to started
    this.gameState.started = true;
    this.gameState.paused = false;
    
    // Add reference to animate function for other modules
    this.gameState.animate = this.animate;
    
    // Hide start screen
    document.getElementById('startMenu').style.display = 'none';
    
    // Initialize player event listeners
    this.player.initEventListeners();
    
    // Generate first level
    this.levelManager.generateLevel(1);
    
    // Make sure player spawns in center, away from walls
    this.camera.position.set(0, PLAYER_HEIGHT, 0);
    
    // Initialize audio system - MUST be done when user has interacted with the page
    if (this.audioManager) {
      // Initialize audio as a result of user interaction
      this.audioManager.initAudio()
        .then(() => {
          console.log('Audio system initialized successfully');
          
          // Get listener and attach to camera
          const listener = this.audioManager.getListener();
          if (listener) {
            // Clean up any existing listeners first to prevent conflicts
            this.camera.children.forEach(child => {
              if (child.type === 'AudioListener') {
                console.log('Removing existing AudioListener');
                this.camera.remove(child);
              }
            });
            
            // Add new listener to camera
            this.camera.add(listener);
            console.log('Added AudioListener to camera');
            
            // Test with a simple sound after listener is attached
            setTimeout(() => {
              try {
                this.audioManager.playSound('menu_click');
                console.log('Test sound played successfully');
              } catch (error) {
                console.warn('Test sound failed:', error);
              }
            }, 500);
          } else {
            console.warn('No AudioListener available from AudioManager');
          }
        })
        .catch(error => {
          console.warn('Failed to initialize audio:', error);
        });
    }
    
    // Start animation loop
    this.animate();
    
    // Add window resize listener
    window.addEventListener('resize', this.onWindowResize);
  }
  
  /**
   * Respawn player after death
   */
  respawnPlayer() {
    // Reset player
    this.gameState.health = 100;
    this.gameState.ammo = 100;
    this.camera.position.set(0, PLAYER_HEIGHT, 0);
    
    // Reset level to 1
    this.levelManager.generateLevel(1);
    
    // Hide death screen
    this.uiManager.hideDeathScreen();
    
    // Lock controls
    this.controls.lock();
    
    // Unpause game
    this.gameState.paused = false;
    
    // Update UI
    this.uiManager.updateHUD();
    this.uiManager.updateKillCounter();
    this.uiManager.showLevelIndicator("Level 1");
    
    // Show message
    this.uiManager.showWardenMessage("You've been reconstructed, Guardian. Continue your mission.");
  }
  
  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(this.animate);
    
    // Set animating flag
    this.animating = true;
    
    // Skip if not started or paused
    if (!this.gameState.started || this.gameState.paused) {
      return;
    }
    
    // Calculate delta time
    const time = performance.now();
    const delta = (time - this.gameState.prevTime) / 1000;
    this.gameState.prevTime = time;
    
    // Update player
    this.player.update(delta);
    
    // Update enemies if any
    if (this.gameState.enemies.length > 0) {
      updateEnemies(this.camera, this.gameState.enemies, this.gameState, this.player.takeDamage);
    }
    
    // Update projectiles
    this.projectilePool.updateProjectiles(this.gameState, this.gameState.enemies, this.gameState.damageEnemy);
    
    // Check for collisions
    this.checkCollisions();
    
    // Update minimap
    if (this.minimapManager) {
      this.minimapManager.update();
    }
    
    // Update MerchGenie kiosks
    if (this.merchGenie) {
      this.merchGenie.updateKiosks(delta);
    }
    
    // Regenerate energy over time
    if (this.gameState.ammo < MAX_AMMO) {
      this.gameState.ammo = Math.min(MAX_AMMO, this.gameState.ammo + AMMO_REGEN_RATE * delta);
      
      // Update HUD less frequently
      if (time - this.gameState.lastHUDUpdate > HUD_UPDATE_INTERVAL) {
        this.gameState.updateHUD();
        this.gameState.lastHUDUpdate = time;
      }
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Check collisions between player and level objects
   */
  checkCollisions() {
    const playerPosition = this.camera.position.clone();
    const playerRadius = PLAYER_RADIUS;
    
    // Check floor collision
    if (playerPosition.y < PLAYER_HEIGHT) {
      playerPosition.y = PLAYER_HEIGHT;
      this.camera.position.y = PLAYER_HEIGHT;
    }
    
    // Check for wall collisions with improved algorithm
    for (let i = 0; i < this.gameState.levelObjects.length; i++) {
      const object = this.gameState.levelObjects[i];
      
      // Skip non-collidable objects
      if (!object || !object.userData || object.userData.type === 'healthPickup') continue;
      
      // Get object bounds
      const box = new this.THREE.Box3().setFromObject(object);
      
      // Check if player is inside the box using a more reliable algorithm
      // Don't expand by player radius - check actual distance to the box surface
      if (box.containsPoint(playerPosition)) {
        // Find the closest face of the box to push out from
        const boxSize = box.getSize(new this.THREE.Vector3());
        const boxCenter = box.getCenter(new this.THREE.Vector3());
        
        // Calculate distance to each face of the box
        const dx = Math.min(
          Math.abs(playerPosition.x - (boxCenter.x + boxSize.x / 2)), 
          Math.abs(playerPosition.x - (boxCenter.x - boxSize.x / 2))
        );
        const dy = Math.min(
          Math.abs(playerPosition.y - (boxCenter.y + boxSize.y / 2)), 
          Math.abs(playerPosition.y - (boxCenter.y - boxSize.y / 2))
        );
        const dz = Math.min(
          Math.abs(playerPosition.z - (boxCenter.z + boxSize.z / 2)), 
          Math.abs(playerPosition.z - (boxCenter.z - boxSize.z / 2))
        );
        
        // Determine which dimension to push out from (the smallest distance)
        if (dx < dy && dx < dz) {
          // Push in X direction
          const signX = Math.sign(playerPosition.x - boxCenter.x);
          this.camera.position.x = boxCenter.x + (boxSize.x / 2 + playerRadius) * signX;
        } else if (dy < dx && dy < dz) {
          // Push in Y direction
          const signY = Math.sign(playerPosition.y - boxCenter.y);
          this.camera.position.y = boxCenter.y + (boxSize.y / 2 + playerRadius) * signY;
        } else {
          // Push in Z direction
          const signZ = Math.sign(playerPosition.z - boxCenter.z);
          this.camera.position.z = boxCenter.z + (boxSize.z / 2 + playerRadius) * signZ;
        }
      }
    }
    
    // Check for enemy collisions
    for (let i = 0; i < this.gameState.enemies.length; i++) {
      const enemy = this.gameState.enemies[i];
      if (!enemy) continue;
      
      const distance = playerPosition.distanceTo(enemy.position);
      if (distance < playerRadius + 1) { // Enemy radius is 1
        // Push player away from enemy
        const direction = playerPosition.clone().sub(enemy.position).normalize();
        this.camera.position.copy(enemy.position).add(direction.multiplyScalar(playerRadius + 1));
      }
    }
    
    // Check for pickup collisions
    for (let i = this.gameState.levelObjects.length - 1; i >= 0; i--) {
      const object = this.gameState.levelObjects[i];
      
      // Skip non-pickups and null objects
      if (!object || !object.userData) continue;
      
      if (object.userData.type === 'healthPickup') {
        // Calculate distance
        const distance = playerPosition.distanceTo(object.position);
        
        // Pickup if close enough
        if (distance < 2.0) {
          console.log('Pickup detected at distance:', distance);
          this.player.pickupHealth(object);
          break;
        }
      }
    }
    
    // Check for MerchGenie kiosk interaction
    if (this.merchGenie) {
      this.merchGenie.checkKioskInteraction(playerPosition);
    }
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Return to gameplay from UI interaction
   */
  returnToGameplay() {
    if (this.gameState.started && !this.gameState.playerDead) {
      // Make sure the game is unpaused
      this.gameState.paused = false;
      
      // Ensure pointer lock is applied 
      this.controls.lock();
      
      // Show warden message to confirm return
      if (this.uiManager) {
        this.uiManager.showWardenMessage("Returning to mission...");
      }
      
      // Resume animation if needed
      if (!this.animating) {
        this.animate();
        this.animating = true;
      }
    }
  }
}
