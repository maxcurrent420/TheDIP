import {
  PLAYER_SPEED,
  MAX_HEALTH,
  MAX_AMMO,
  AMMO_REGEN_RATE,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  MOVEMENT_SPEED,
  SPRINT_MULTIPLIER,
  JUMP_FORCE,
  GRAVITY,
  DIMENSION_SHIFT_COOLDOWN,
  POWERSTONE_COOLDOWN
} from './constants.js';
import { throttle } from './utils.js';
import { firePower, checkPowerAbsorption } from './powerManager.js';

/**
 * Player class to manage player state and controls
 */
export class Player {
  constructor(camera, controls, gameState, THREE) {
    this.camera = camera;
    this.controls = controls;
    this.gameState = gameState;
    this.THREE = THREE;
    
    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;  // Add sprint state tracking
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.lastDamageAnimation = 0;
    
    // Store projectile pool from gameState
    this.projectilePool = gameState.projectilePool;
    
    // Bind methods to correct this context
    this.update = this.update.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.takeDamage = this.takeDamage.bind(this);
    this.attemptPowerAbsorption = this.attemptPowerAbsorption.bind(this);
    this.shiftDimension = throttle(this.shiftDimension.bind(this), DIMENSION_SHIFT_COOLDOWN);
  }
  
  /**
   * Initialize player event listeners
   */
  initEventListeners() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Remove player event listeners
   */
  removeEventListeners() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousedown', this.onMouseDown);
  }
  
  /**
   * Key down event handler
   * @param {KeyboardEvent} event - Key event
   */
  onKeyDown(event) {
    if (!this.gameState.started || this.gameState.paused) return;
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
        
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
        
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
        
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
        
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
        
      case 'Digit1':
        // Update both state variables for consistency
        this.gameState.currentPower = 0;
        this.gameState.activePowerIndex = 0;
        
        // Update HUD
        if (this.gameState.updatePowerSlots) {
          this.gameState.updatePowerSlots();
        } else if (this.gameState.uiManager) {
          this.gameState.uiManager.updatePowerSlots();
        }
        console.log("Switched to power 1");
        break;
        
      case 'Digit2':
        // Update both state variables for consistency
        this.gameState.currentPower = 1;
        this.gameState.activePowerIndex = 1;
        
        // Update HUD
        if (this.gameState.updatePowerSlots) {
          this.gameState.updatePowerSlots();
        } else if (this.gameState.uiManager) {
          this.gameState.uiManager.updatePowerSlots();
        }
        console.log("Switched to power 2");
        break;
        
      case 'Digit3':
        // Update both state variables for consistency
        this.gameState.currentPower = 2;
        this.gameState.activePowerIndex = 2;
        
        // Update HUD
        if (this.gameState.updatePowerSlots) {
          this.gameState.updatePowerSlots();
        } else if (this.gameState.uiManager) {
          this.gameState.uiManager.updatePowerSlots();
        }
        console.log("Switched to power 3");
        break;
        
      case 'Digit4':
        // Set PowerStone as the active power (slot 4)
        this.gameState.currentPower = 3;
        this.gameState.activePowerIndex = 3;
        
        // Update UI to show PowerStone slot as active
        if (this.gameState.updatePowerSlots) {
          this.gameState.updatePowerSlots();
        } else if (this.gameState.uiManager) {
          this.gameState.uiManager.updatePowerSlots();
        }
        
        if (this.gameState.equippedPowerStone) {
          this.gameState.showWardenMessage(`PowerStone selected: ${this.gameState.equippedPowerStone.name}`);
          console.log("PowerStone selected");
        } else {
          this.gameState.showWardenMessage("No PowerStone equipped. Visit inventory to equip one");
          console.log("No PowerStone equipped");
        }
        break;
        
      case 'KeyE':
        // Set PowerStone as the active power (slot 4)
        this.gameState.currentPower = 3;
        this.gameState.activePowerIndex = 3;
        
        // Update UI to show PowerStone slot as active
        if (this.gameState.updatePowerSlots) {
          this.gameState.updatePowerSlots();
        } else if (this.gameState.uiManager) {
          this.gameState.uiManager.updatePowerSlots();
        }
        
        if (this.gameState.equippedPowerStone) {
          this.gameState.showWardenMessage(`PowerStone selected: ${this.gameState.equippedPowerStone.name}`);
          console.log("PowerStone selected");
        } else {
          this.gameState.showWardenMessage("No PowerStone equipped. Visit inventory to equip one");
          console.log("No PowerStone equipped");
        }
        break;
        
      case 'KeyQ':
        this.shiftDimension();
        break;
        
      case 'KeyF':
        this.tryInteractWithKiosk();
        break;
        
      case 'Escape':
        if (this.gameState.paused) {
          this.controls.lock();
          this.gameState.paused = false;
        } else {
          this.controls.unlock();
          this.gameState.paused = true;
        }
        break;
        
      case 'KeyI':
        this.toggleInventoryMenu();
        break;
    }
  }
  
  /**
   * Key up event handler
   * @param {KeyboardEvent} event - Key event
   */
  onKeyUp(event) {
    if (!this.gameState.started) return;
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
        
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
        
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
        
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
        
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  }
  
  /**
   * Mouse down event handler
   * @param {MouseEvent} event - Mouse event
   */
  onMouseDown(event) {
    if (!this.gameState.started || this.gameState.paused) return;
    
    // Left mouse button
    if (event.button === 0) {
      // Different behavior based on the selected power
      if (this.gameState.currentPower === 3) {
        // Activate PowerStone if the PowerStone slot is selected
        if (this.gameState.equippedPowerStone) {
          this.activatePowerStone();
        }
      } else if (this.gameState.powers[this.gameState.currentPower]) {
        // Fire the selected power using the imported function
        firePower(
          this.THREE,
          this.gameState,
          this.camera,
          this.gameState.projectilePool,
          () => this.gameState.updateHUD(),
          (message) => this.gameState.showWardenMessage(message)
        );
      }
    }
    // Right mouse button
    else if (event.button === 2) {
      // Attempt to absorb power from an enemy
      this.attemptPowerAbsorption();
    }
  }
  
  /**
   * Attempt to absorb power from enemy
   */
  attemptPowerAbsorption() {
    checkPowerAbsorption(
      this.THREE,
      this.gameState,
      this.camera,
      this.gameState.damageEnemy,
      this.gameState.updatePowerSlots,
      this.gameState.showWardenMessage
    );
  }
  
  /**
   * Update player movement and state
   * @param {number} delta - Time delta
   */
  update(delta) {
    if (!this.gameState.started || this.gameState.paused) return;
    
    // Gradually regenerate ammo
    if (this.gameState.ammo < MAX_AMMO) {
      this.gameState.ammo = Math.min(MAX_AMMO, this.gameState.ammo + AMMO_REGEN_RATE * delta);
      this.gameState.updateHUD();
    }
    
    // Move player based on controls
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    // Apply sprint multiplier if sprinting
    const speedMultiplier = this.isSprinting ? SPRINT_MULTIPLIER : 1.0;
    
    // Set velocity based on direction
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * PLAYER_SPEED * speedMultiplier * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * PLAYER_SPEED * speedMultiplier * delta;
    }
    
    // Apply movement to controls
    this.controls.moveRight(-this.velocity.x);
    this.controls.moveForward(-this.velocity.z);
  }
  
  /**
   * Apply damage to player
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this.gameState.health = Math.max(0, this.gameState.health - amount);
    this.gameState.updateHUD();
    
    // Play sound effect
    if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
      this.gameState.audioManager.playSound('player_damage');
    }
    
    // Play damage animation
    this.createDamageAnimation();
    
    // Check if player died
    if (this.gameState.health <= 0) {
      this.die();
    }
  }
  
  /**
   * Handle player death
   */
  die() {
    // Play death sound effect
    if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
      this.gameState.audioManager.playSound('player_death');
    }
    
    // Show death screen
    const deathScreen = document.getElementById('deathScreen');
    const deathMessage = document.getElementById('deathMessage');
    
    deathScreen.style.display = 'flex';
    deathMessage.textContent = `You were overwhelmed by the dimensional anomalies.
      Total enemies defeated: ${this.gameState.totalEnemiesDefeated}`;
    
    // Unlock controls
    this.controls.unlock();
    
    // Pause game
    this.gameState.paused = true;
  }
  
  /**
   * Create damage animation effect
   */
  createDamageAnimation() {
    const now = Date.now();
    if (now - this.lastDamageAnimation < 500) return;
    
    this.lastDamageAnimation = now;
    
    // Create red overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '100';
    document.body.appendChild(overlay);
    
    // Flash animation
    setTimeout(() => { overlay.style.opacity = '0.5'; }, 0);
    setTimeout(() => { overlay.style.opacity = '0'; }, 200);
    setTimeout(() => { document.body.removeChild(overlay); }, 400);
  }
  
  /**
   * Shift to another dimension
   */
  shiftDimension() {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.gameState.lastDimensionShift < DIMENSION_SHIFT_COOLDOWN) {
      const remainingCooldown = Math.ceil((DIMENSION_SHIFT_COOLDOWN - (now - this.gameState.lastDimensionShift)) / 1000);
      this.gameState.showWardenMessage(`Dimension shift on cooldown: ${remainingCooldown}s`);
      return;
    }
    
    // Get current dimension index
    const dimensions = ['prime', 'void', 'nexus', 'quantum'];
    const currentIndex = dimensions.indexOf(this.gameState.dimension);
    
    // Shift to next dimension
    const nextIndex = (currentIndex + 1) % dimensions.length;
    this.gameState.dimension = dimensions[nextIndex];
    
    // Update UI
    const dimensionIndicator = document.getElementById('dimensionIndicator');
    dimensionIndicator.textContent = `Dimension: ${this.gameState.dimension.toUpperCase()}`;
    
    // Play dimension shift sound
    if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
      this.gameState.audioManager.playSound('dimension_shift');
    }
    
    // Show effect
    this.createDimensionShiftEffect();
    
    // Apply dimension effects
    this.gameState.applyDimensionEffects();
    
    // Regenerate textures
    this.gameState.regenerateTextures(this.gameState.dimension);
    
    // Update cooldown
    this.gameState.lastDimensionShift = now;
    
    // Show message
    this.gameState.showWardenMessage(`Shifted to ${this.gameState.dimension} dimension`);
  }
  
  /**
   * Create dimension shift visual effect
   */
  createDimensionShiftEffect() {
    // Create ripple overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'all 0.5s ease';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '100';
    document.body.appendChild(overlay);
    
    // Ripple animation
    setTimeout(() => { overlay.style.opacity = '1'; overlay.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)'; }, 0);
    setTimeout(() => { overlay.style.opacity = '0'; }, 400);
    setTimeout(() => { document.body.removeChild(overlay); }, 600);
  }
  
  /**
   * Pick up a health pickup
   * @param {THREE.Mesh} pickup - Health pickup mesh
   */
  pickupHealth(pickup) {
    // Add health
    this.gameState.health = Math.min(MAX_HEALTH, this.gameState.health + pickup.userData.value);
    
    // Play pickup sound with proper error handling
    if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
      try {
        this.gameState.audioManager.playSound('pickup_health', { volume: 0.7 });
        console.log('Playing health pickup sound');
      } catch (error) {
        console.warn('Failed to play pickup sound:', error);
      }
    }
    
    // Update UI
    this.gameState.updateHUD();
    
    // Show message
    this.gameState.showWardenMessage(`Picked up health +${pickup.userData.value}`);
    
    // Remove pickup from scene
    this.gameState.scene.remove(pickup);
    
    // Remove from level objects
    const index = this.gameState.levelObjects.indexOf(pickup);
    if (index > -1) {
      this.gameState.levelObjects.splice(index, 1);
    }
  }
  
  /**
   * Try to interact with a MerchGenie kiosk
   */
  tryInteractWithKiosk() {
    // If a kiosk is already active, hide it
    const kioskMenu = document.getElementById('kioskMenu');
    if (kioskMenu && kioskMenu.style.display === 'flex') {
      // Hide kiosk menu
      if (this.gameState.merchGenie) {
        this.gameState.merchGenie.hideKioskMenu();
      }
      return;
    }
    
    // No kiosk active, check if near a kiosk
    if (this.gameState.merchGenie) {
      const playerPosition = this.camera.position.clone();
      this.gameState.merchGenie.checkKioskInteraction(playerPosition);
    }
  }
  
  /**
   * Activate PowerStone special ability
   */
  activatePowerStone() {
    if (!this.gameState.equippedPowerStone) return;
    
    // Check cooldown
    const now = Date.now();
    const stone = this.gameState.equippedPowerStone;
    
    // Check if on cooldown
    if (now - this.gameState.lastPowerStoneUse < POWERSTONE_COOLDOWN) {
      const remainingCooldown = Math.ceil((POWERSTONE_COOLDOWN - (now - this.gameState.lastPowerStoneUse)) / 1000);
      this.gameState.showWardenMessage(`PowerStone on cooldown: ${remainingCooldown}s`);
      return;
    }
    
    // Set cooldown
    this.gameState.lastPowerStoneUse = now;
    
    // Handle different stone types
    if (stone.effect.type === 'aoe') {
      // AOE damage effect (like Steam Stone)
      this.createAOEEffect(stone.effect.radius, stone.effect.damage);
    } else if (stone.effect.type === 'dash') {
      // Dash effect (like Phoenix Stone)
      this.createDashEffect(stone.effect.distance, stone.effect.damage);
    } else if (stone.effect.type === 'freeze') {
      // Freeze effect (like Winter Step Stone)
      this.createFreezeEffect(stone.effect.radius);
    } else if (stone.effect.type === 'defense') {
      // Defense effect (like Molten Shield)
      this.createDefenseEffect(stone.effect.reflectDamage);
    } else if (stone.effect.type === 'invulnerable') {
      // Invulnerability effect (like Phase Shield)
      this.createInvulnerabilityEffect(stone.effect.duration);
    } else {
      // Generic effect for other stones
      this.gameState.showWardenMessage(`Activated ${stone.name}!`);
      
      // Create visual effect
      import('./powerManager.js').then(({ createPowerStoneEffect }) => {
        createPowerStoneEffect(this.THREE, this.camera.position, stone.color);
      });
    }
  }
  
  /**
   * Create AOE effect for PowerStone
   * @param {number} radius - Effect radius
   * @param {number} damage - Damage amount
   */
  createAOEEffect(radius, damage) {
    const position = this.camera.position.clone();
    
    // Visual effect
    const geometry = new this.THREE.SphereGeometry(radius, 16, 16);
    const material = new this.THREE.MeshBasicMaterial({
      color: this.gameState.equippedPowerStone.color,
      transparent: true,
      opacity: 0.5
    });
    
    const sphere = new this.THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.camera.parent.add(sphere);
    
    // Damage enemies in radius
    this.gameState.enemies.forEach(enemy => {
      const distance = position.distanceTo(enemy.position);
      if (distance <= radius) {
        // Damage falls off with distance
        const distanceFactor = 1 - (distance / radius);
        const actualDamage = Math.floor(damage * distanceFactor);
        this.gameState.damageEnemy(enemy, actualDamage);
      }
    });
    
    // Message
    this.gameState.showWardenMessage(`${this.gameState.equippedPowerStone.name} activated!`);
    
    // Remove effect after a delay
    setTimeout(() => {
      if (this.camera.parent) {
        this.camera.parent.remove(sphere);
      }
    }, 1000);
  }
  
  /**
   * Create dash effect for PowerStone
   * @param {number} distance - Dash distance
   * @param {number} damage - Damage amount
   */
  createDashEffect(distance, damage) {
    const direction = new this.THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const startPosition = this.camera.position.clone();
    const endPosition = startPosition.clone().add(direction.multiplyScalar(distance));
    
    // Create trail effect
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const point = startPosition.clone().lerp(endPosition, i / 10);
      points.push(point);
    }
    
    const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new this.THREE.LineBasicMaterial({
      color: this.gameState.equippedPowerStone.color,
      linewidth: 3
    });
    
    const line = new this.THREE.Line(lineGeometry, lineMaterial);
    this.camera.parent.add(line);
    
    // Move player
    this.camera.position.copy(endPosition);
    
    // Damage enemies in path
    this.gameState.enemies.forEach(enemy => {
      // Check if enemy is in the path
      const enemyToStart = enemy.position.clone().sub(startPosition);
      const projection = enemyToStart.dot(direction) / direction.length();
      
      if (projection > 0 && projection < distance) {
        const closestPoint = startPosition.clone().add(direction.clone().normalize().multiplyScalar(projection));
        const distanceToPath = enemy.position.distanceTo(closestPoint);
        
        if (distanceToPath < 2) { // Within 2 units of dash path
          this.gameState.damageEnemy(enemy, damage);
        }
      }
    });
    
    // Message
    this.gameState.showWardenMessage(`${this.gameState.equippedPowerStone.name} dash!`);
    
    // Remove trail after a delay
    setTimeout(() => {
      if (this.camera.parent) {
        this.camera.parent.remove(line);
      }
    }, 1000);
  }
  
  /**
   * Create freeze effect for PowerStone
   * @param {number} radius - Freeze radius
   */
  createFreezeEffect(radius) {
    const position = this.camera.position.clone();
    
    // Visual effect - create ice particles
    const particles = new this.THREE.Group();
    const particleCount = 30;
    
    // Create ice particle material
    const material = new this.THREE.MeshBasicMaterial({
      color: this.gameState.equippedPowerStone.color,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < particleCount; i++) {
      // Varied ice crystal shapes
      let geometry;
      const shapeType = Math.floor(Math.random() * 3);
      
      if (shapeType === 0) {
        // Tetrahedron for sharp icicles
        geometry = new this.THREE.TetrahedronGeometry(0.2 + Math.random() * 0.2);
      } else if (shapeType === 1) {
        // Box for cubic crystals
        geometry = new this.THREE.BoxGeometry(0.2 + Math.random() * 0.2, 0.2 + Math.random() * 0.2, 0.2 + Math.random() * 0.2);
      } else {
        // Octahedron for diamond-like crystals
        geometry = new this.THREE.OctahedronGeometry(0.2 + Math.random() * 0.2);
      }
      
      const particle = new this.THREE.Mesh(geometry, material.clone());
      
      // Random position within radius sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random()); // Cube root for uniform distribution in sphere
      
      particle.position.set(
        position.x + r * Math.sin(phi) * Math.cos(theta),
        position.y + r * Math.sin(phi) * Math.sin(theta),
        position.z + r * Math.cos(phi)
      );
      
      // Random rotation
      particle.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      particles.add(particle);
      
      // Animation data
      particle.userData = {
        life: 30 + Math.random() * 30,
        rotationSpeed: new this.THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        )
      };
    }
    
    // Add particles to scene
    this.camera.parent.add(particles);
    
    // Apply freeze effect to enemies
    this.gameState.enemies.forEach(enemy => {
      const distance = position.distanceTo(enemy.position);
      
      if (distance <= radius) {
        // Apply freeze effect
        if (!enemy.userData.frozen) {
          // Store original properties
          enemy.userData.frozen = true;
          enemy.userData.originalSpeed = enemy.userData.speed;
          enemy.userData.originalColor = enemy.material.color.clone();
          
          // Slow down enemy
          enemy.userData.speed *= 0.3;
          
          // Change color to ice blue
          enemy.material.color.set(this.gameState.equippedPowerStone.color);
          
          // Create frost overlay on enemy
          const frostGeometry = new this.THREE.SphereGeometry(enemy.geometry.parameters.radius * 1.05, 8, 8);
          const frostMaterial = new this.THREE.MeshBasicMaterial({
            color: this.gameState.equippedPowerStone.color,
            transparent: true,
            opacity: 0.3,
            wireframe: true
          });
          
          const frost = new this.THREE.Mesh(frostGeometry, frostMaterial);
          enemy.add(frost);
          enemy.userData.frost = frost;
          
          // Unfreeze after 5 seconds
          setTimeout(() => {
            if (enemy && !enemy.userData.isDead) {
              enemy.userData.frozen = false;
              enemy.userData.speed = enemy.userData.originalSpeed;
              enemy.material.color.copy(enemy.userData.originalColor);
              
              if (enemy.userData.frost) {
                enemy.remove(enemy.userData.frost);
                enemy.userData.frost = null;
              }
            }
          }, 5000);
        }
      }
    });
    
    // Message
    this.gameState.showWardenMessage(`${this.gameState.equippedPowerStone.name} freeze field!`);
    
    // Animate particles
    const animate = () => {
      let allDead = true;
      
      for (let i = 0; i < particles.children.length; i++) {
        const particle = particles.children[i];
        
        // Rotate
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;
        
        // Fade
        particle.userData.life--;
        particle.material.opacity = particle.userData.life / 60;
        
        if (particle.userData.life > 0) {
          allDead = false;
        }
      }
      
      if (!allDead) {
        requestAnimationFrame(animate);
      } else {
        if (this.camera.parent) {
          this.camera.parent.remove(particles);
        }
      }
    };
    
    animate();
  }
  
  /**
   * Create defense effect for PowerStone
   * @param {number} reflectDamage - Damage to reflect back to attackers
   */
  createDefenseEffect(reflectDamage) {
    // Create shield mesh
    const geometry = new this.THREE.SphereGeometry(1.5, 32, 32);
    const material = new this.THREE.MeshBasicMaterial({
      color: this.gameState.equippedPowerStone.color,
      transparent: true,
      opacity: 0.4,
      side: this.THREE.DoubleSide
    });
    
    const shield = new this.THREE.Mesh(geometry, material);
    
    // Add to camera/player
    this.camera.add(shield);
    
    // Add shield to gameState to track
    this.gameState.playerShield = {
      mesh: shield,
      reflectDamage: reflectDamage,
      duration: 10, // 10 seconds
      createdAt: Date.now()
    };
    
    // Add pulse effect to original takeDamage function
    const originalTakeDamage = this.takeDamage;
    this.takeDamage = (amount, attacker) => {
      // If we have a shield and an attacker
      if (this.gameState.playerShield && attacker) {
        // Reflect damage back to attacker
        this.gameState.damageEnemy(attacker, this.gameState.playerShield.reflectDamage);
        
        // Create pulse effect
        const shieldPulse = shield.clone();
        shieldPulse.material = shield.material.clone();
        shieldPulse.material.opacity = 0.7;
        this.camera.add(shieldPulse);
        
        // Pulse animation
        let pulseSize = 1.0;
        const animatePulse = () => {
          pulseSize += 0.1;
          shieldPulse.scale.set(pulseSize, pulseSize, pulseSize);
          shieldPulse.material.opacity -= 0.05;
          
          if (shieldPulse.material.opacity > 0) {
            requestAnimationFrame(animatePulse);
          } else {
            this.camera.remove(shieldPulse);
          }
        };
        
        animatePulse();
        
        // Take reduced damage (50% reduction)
        originalTakeDamage.call(this, amount * 0.5);
      } else {
        // No shield, take normal damage
        originalTakeDamage.call(this, amount);
      }
    };
    
    // Message
    this.gameState.showWardenMessage(`${this.gameState.equippedPowerStone.name} defense activated!`);
    
    // Shield duration
    setTimeout(() => {
      // Remove shield
      if (shield.parent) {
        shield.parent.remove(shield);
      }
      
      // Clear shield from gameState
      this.gameState.playerShield = null;
      
      // Restore original takeDamage
      this.takeDamage = originalTakeDamage;
      
      // Message
      this.gameState.showWardenMessage("Shield faded away");
    }, 10000); // 10 seconds
  }
  
  /**
   * Create invulnerability effect for PowerStone
   * @param {number} duration - Effect duration in seconds
   */
  createInvulnerabilityEffect(duration) {
    // Create phase effect material
    const material = new this.THREE.MeshBasicMaterial({
      color: this.gameState.equippedPowerStone.color,
      transparent: true,
      opacity: 0.3,
      side: this.THREE.DoubleSide,
      wireframe: true
    });
    
    // Create phase effect mesh (double layered)
    const innerGeometry = new this.THREE.SphereGeometry(1.2, 16, 16);
    const outerGeometry = new this.THREE.SphereGeometry(1.5, 16, 16);
    
    const innerSphere = new this.THREE.Mesh(innerGeometry, material.clone());
    const outerSphere = new this.THREE.Mesh(outerGeometry, material.clone());
    
    // Add both spheres to a group
    const phaseEffect = new this.THREE.Group();
    phaseEffect.add(innerSphere);
    phaseEffect.add(outerSphere);
    
    // Add to camera
    this.camera.add(phaseEffect);
    
    // Store original properties
    const originalCollidable = true;
    const originalTakeDamage = this.takeDamage;
    
    // Make player invulnerable
    this.takeDamage = () => {
      // Do nothing - player is invulnerable
    };
    
    // Store effect in gameState
    this.gameState.phaseEffect = {
      mesh: phaseEffect,
      duration: duration,
      startTime: Date.now()
    };
    
    // Animate phase effect - counter-rotating spheres
    const animate = () => {
      if (!this.gameState.phaseEffect) return;
      
      innerSphere.rotation.x += 0.01;
      innerSphere.rotation.y += 0.02;
      
      outerSphere.rotation.x -= 0.02;
      outerSphere.rotation.y -= 0.01;
      
      // Pulse opacity
      const elapsed = (Date.now() - this.gameState.phaseEffect.startTime) / 1000;
      const pulse = Math.sin(elapsed * 3) * 0.1 + 0.3;
      
      innerSphere.material.opacity = pulse;
      outerSphere.material.opacity = pulse * 0.7;
      
      // Continue animation if effect is still active
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    // Message
    this.gameState.showWardenMessage(`${this.gameState.equippedPowerStone.name} phase shield active!`);
    
    // Duration timer
    setTimeout(() => {
      // Remove phase effect
      if (phaseEffect.parent) {
        phaseEffect.parent.remove(phaseEffect);
      }
      
      // Clear effect from gameState
      this.gameState.phaseEffect = null;
      
      // Restore original properties
      this.takeDamage = originalTakeDamage;
      
      // Message
      this.gameState.showWardenMessage("Phase shield deactivated");
    }, duration * 1000);
  }
  
  /**
   * Toggle the PowerStone inventory menu
   */
  toggleInventoryMenu() {
    // Check if the inventory menu exists
    let inventoryMenu = document.getElementById('inventoryMenu');
    
    // If it doesn't exist, create it
    if (!inventoryMenu) {
      inventoryMenu = this.createInventoryMenu();
      document.body.appendChild(inventoryMenu);
    }
    
    // Toggle visibility
    if (inventoryMenu.style.display === 'none' || inventoryMenu.style.display === '') {
      this.openInventoryMenu();
    } else {
      this.closeInventoryMenu();
    }
  }
  
  /**
   * Open the PowerStone inventory menu
   */
  openInventoryMenu() {
    const inventoryMenu = document.getElementById('inventoryMenu');
    if (!inventoryMenu) return;
    
    // Pause the game while menu is open
    this.gameState.paused = true;
    
    // Update inventory contents
    this.updateInventoryMenu();
    
    // Show the menu
    inventoryMenu.style.display = 'flex';
    
    // Show message
    this.gameState.showWardenMessage('PowerStone Inventory');
  }
  
  /**
   * Close the PowerStone inventory menu
   */
  closeInventoryMenu() {
    const inventoryMenu = document.getElementById('inventoryMenu');
    if (!inventoryMenu) return;
    
    // Hide the menu
    inventoryMenu.style.display = 'none';
    
    // Unpause the game when closing the menu
    this.gameState.paused = false;
    
    // Lock the controls to resume gameplay
    if (this.controls && this.controls.isLocked === false) {
      this.controls.lock();
    }
    
    // Call game's returnToGameplay if available to ensure proper resume
    if (this.gameState.returnToGameplay) {
      this.gameState.returnToGameplay();
    }
    
    // Show message
    this.gameState.showWardenMessage('Returning to mission...');
  }
  
  /**
   * Create the PowerStone inventory menu
   */
  createInventoryMenu() {
    const inventoryMenu = document.createElement('div');
    inventoryMenu.id = 'inventoryMenu';
    inventoryMenu.style.display = 'none';
    inventoryMenu.style.position = 'absolute';
    inventoryMenu.style.top = '50%';
    inventoryMenu.style.left = '50%';
    inventoryMenu.style.transform = 'translate(-50%, -50%)';
    inventoryMenu.style.width = '700px';
    inventoryMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    inventoryMenu.style.border = '2px solid #66ccff';
    inventoryMenu.style.borderRadius = '10px';
    inventoryMenu.style.padding = '20px';
    inventoryMenu.style.zIndex = '1000';
    inventoryMenu.style.flexDirection = 'column';
    inventoryMenu.style.alignItems = 'center';
    inventoryMenu.style.color = 'white';
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'PowerStone Inventory';
    title.style.textAlign = 'center';
    title.style.color = '#66ccff';
    title.style.marginBottom = '20px';
    
    // PowerStone list
    const stoneList = document.createElement('div');
    stoneList.id = 'powerStoneList';
    stoneList.style.display = 'flex';
    stoneList.style.flexWrap = 'wrap';
    stoneList.style.justifyContent = 'center';
    stoneList.style.gap = '15px';
    stoneList.style.marginBottom = '20px';
    stoneList.style.maxHeight = '400px';
    stoneList.style.overflowY = 'auto';
    stoneList.style.width = '100%';
    stoneList.style.padding = '10px';
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#333';
    closeButton.style.color = 'white';
    closeButton.style.border = '1px solid #66ccff';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => this.closeInventoryMenu());
    
    // Help text
    const helpText = document.createElement('p');
    helpText.textContent = 'Select a PowerStone to equip it to your fourth slot. Press I to close.';
    helpText.style.textAlign = 'center';
    helpText.style.fontSize = '14px';
    helpText.style.marginTop = '10px';
    helpText.style.opacity = '0.7';
    
    // Add to menu
    inventoryMenu.appendChild(title);
    inventoryMenu.appendChild(stoneList);
    inventoryMenu.appendChild(closeButton);
    inventoryMenu.appendChild(helpText);
    
    return inventoryMenu;
  }
  
  /**
   * Update the PowerStone inventory menu contents
   */
  updateInventoryMenu() {
    const stoneList = document.getElementById('powerStoneList');
    if (!stoneList) return;
    
    // Clear list
    stoneList.innerHTML = '';
    
    if (this.gameState.powerStoneInventory && this.gameState.powerStoneInventory.length > 0) {
      // Create a card for each PowerStone
      this.gameState.powerStoneInventory.forEach((stone, index) => {
        const stoneCard = document.createElement('div');
        stoneCard.className = 'stone-card';
        stoneCard.style.width = '150px';
        stoneCard.style.height = '180px';
        stoneCard.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        stoneCard.style.border = `2px solid ${stone.color}`;
        stoneCard.style.borderRadius = '10px';
        stoneCard.style.padding = '10px';
        stoneCard.style.display = 'flex';
        stoneCard.style.flexDirection = 'column';
        stoneCard.style.alignItems = 'center';
        stoneCard.style.justifyContent = 'space-between';
        
        // Check if this stone is equipped
        if (this.gameState.equippedPowerStone && this.gameState.equippedPowerStone === stone) {
          stoneCard.style.backgroundColor = 'rgba(102, 204, 255, 0.3)';
        }
        
        const stoneIcon = document.createElement('div');
        stoneIcon.textContent = '💎';
        stoneIcon.style.fontSize = '40px';
        stoneIcon.style.margin = '10px 0';
        
        const stoneName = document.createElement('div');
        stoneName.textContent = stone.name;
        stoneName.style.fontWeight = 'bold';
        stoneName.style.marginBottom = '5px';
        stoneName.style.textAlign = 'center';
        
        const stoneType = document.createElement('div');
        stoneType.textContent = stone.type;
        stoneType.style.fontSize = '12px';
        stoneType.style.opacity = '0.7';
        stoneType.style.marginBottom = '10px';
        
        const equipButton = document.createElement('button');
        equipButton.textContent = this.gameState.equippedPowerStone === stone ? 'Equipped' : 'Equip';
        equipButton.style.padding = '5px 10px';
        equipButton.style.backgroundColor = this.gameState.equippedPowerStone === stone ? '#4CAF50' : '#333';
        equipButton.style.color = 'white';
        equipButton.style.border = `1px solid ${stone.color}`;
        equipButton.style.borderRadius = '5px';
        equipButton.style.cursor = 'pointer';
        
        // Equip button handler
        equipButton.addEventListener('click', () => {
          this.equipPowerStoneFromInventory(stone);
        });
        
        stoneCard.appendChild(stoneIcon);
        stoneCard.appendChild(stoneName);
        stoneCard.appendChild(stoneType);
        stoneCard.appendChild(equipButton);
        
        stoneList.appendChild(stoneCard);
      });
    } else {
      // No PowerStones available message
      const noStones = document.createElement('div');
      noStones.textContent = 'No PowerStones available. Fuse powers to create PowerStones.';
      noStones.style.padding = '20px';
      noStones.style.opacity = '0.7';
      stoneList.appendChild(noStones);
    }
  }
  
  /**
   * Equip a PowerStone from the inventory
   * @param {Object} stone - PowerStone to equip
   */
  equipPowerStoneFromInventory(stone) {
    if (!stone) return;
    
    // Equip the PowerStone in the dedicated slot
    this.gameState.equippedPowerStone = stone;
    
    // For backward compatibility 
    this.gameState.powerStone = stone;
    
    // Update the inventory menu
    this.updateInventoryMenu();
    
    // Update UI
    if (this.gameState.uiManager) {
      this.gameState.uiManager.updateHUD();
    }
    
    // Show message
    this.gameState.showWardenMessage(`Equipped ${stone.name} in PowerStone slot`);
    
    console.log(`Equipped PowerStone: ${stone.name}`);
  }
}
