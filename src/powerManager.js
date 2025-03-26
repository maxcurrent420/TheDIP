// Power manager module
import * as THREE from 'three';
import { POWER_COST, ABSORB_RANGE, TELEPORT_DISTANCE, ATTACK_COOLDOWN } from './constants.js';
import { showError, getDistance } from './utils.js';

// Power type definitions
export const powerTypes = {
  bullet: {
    name: 'Bullet',
    color: 0xdddddd,
    icon: '•',
    damage: 10,
    speed: 1.0,
    cooldown: 300,
    cost: POWER_COST.bullet
  },
  fireball: {
    name: 'Fireball',
    color: 0xff6600,
    icon: '🔥',
    damage: 20,
    speed: 0.6,
    cooldown: 600,
    cost: POWER_COST.fireball
  },
  ice: {
    name: 'Ice Shard',
    color: 0x66ccff,
    icon: '❄️',
    damage: 15,
    speed: 0.8,
    cooldown: 500,
    cost: POWER_COST.ice
  },
  sonic: {
    name: 'Sonic Wave',
    color: 0x9966ff,
    icon: '◎',
    damage: 15,
    speed: 1.5,
    cooldown: 100,
    cost: POWER_COST.sonic
  },
  shield: {
    name: 'Shield',
    color: 0x00ff00,
    icon: '⛊',
    damage: 5,
    speed: 0.5,
    cooldown: 1000,
    cost: POWER_COST.shield
  },
  teleport: {
    name: 'Teleport',
    color: 0xff00ff,
    icon: '⟿',
    damage: 15,
    speed: 0,
    cooldown: 1500,
    cost: POWER_COST.teleport
  }
};

/**
 * PowerStone definitions
 * These are created by combining two powers
 */
export const powerStoneTypes = {
  // Fire combinations
  fireIce: {
    name: 'Steam Stone',
    color: 0xccddee,
    icon: '🔥❄️',
    components: ['fireball', 'ice'],
    effect: {
      type: 'aoe',
      damage: 30,
      radius: 6,
      description: 'Creates a steam cloud that damages enemies within radius'
    }
  },
  fireSonic: {
    name: 'Inferno Stone',
    color: 0xff3366,
    icon: '🔥◎',
    components: ['fireball', 'sonic'],
    effect: {
      type: 'spread',
      damage: 35,
      speed: 0.8,
      count: 5,
      description: 'Creates a spreading inferno that jumps between enemies'
    }
  },
  fireShield: {
    name: 'Molten Shield Stone',
    color: 0xff8800,
    icon: '🔥⛊',
    components: ['fireball', 'shield'],
    effect: {
      type: 'defense',
      damage: 20,
      reflectDamage: 25,
      duration: 6,
      description: 'Creates a molten shield that reflects damage back to enemies'
    }
  },
  fireTeleport: {
    name: 'Phoenix Stone',
    color: 0xff3300,
    icon: '🔥⟿',
    components: ['fireball', 'teleport'],
    effect: {
      type: 'dash',
      damage: 35,
      distance: 10,
      description: 'Dash forward in a blaze, damaging all enemies in your path'
    }
  },

  // Ice combinations
  iceSonic: {
    name: 'Frost Wave Stone',
    color: 0x55ccff,
    icon: '❄️◎',
    components: ['ice', 'sonic'],
    effect: {
      type: 'slow',
      damage: 25,
      slowFactor: 0.5,
      duration: 8,
      description: 'Creates a wave that slows enemies and increases damage taken'
    }
  },
  iceShield: {
    name: 'Glacier Shield Stone',
    color: 0x33aaff,
    icon: '❄️⛊',
    components: ['ice', 'shield'],
    effect: {
      type: 'defense',
      damage: 10,
      freezeChance: 0.3,
      duration: 8,
      description: 'Creates an ice shield that has a chance to freeze attackers'
    }
  },
  iceTeleport: {
    name: 'Winter Step Stone',
    color: 0x55aadd,
    icon: '❄️⟿',
    components: ['ice', 'teleport'],
    effect: {
      type: 'freeze',
      damage: 20,
      radius: 5,
      duration: 4,
      description: 'Teleport and freeze all enemies at your destination'
    }
  },

  // Sonic combinations
  sonicShield: {
    name: 'Resonance Stone',
    color: 0x9955dd,
    icon: '◎⛊',
    components: ['sonic', 'shield'],
    effect: {
      type: 'pulse',
      damage: 8,
      pulseRate: 0.5,
      pulseCount: 6,
      description: 'Creates a shield that periodically emits damaging sonic pulses'
    }
  },
  sonicTeleport: {
    name: 'Thunder Step Stone',
    color: 0xaa66ff,
    icon: '◎⟿',
    components: ['sonic', 'teleport'],
    effect: {
      type: 'blink',
      damage: 30,
      blinkCount: 3,
      distance: 6,
      description: 'Rapidly teleport between multiple positions, damaging enemies at each location'
    }
  },

  // Shield + Teleport
  shieldTeleport: {
    name: 'Phase Shield Stone',
    color: 0x66ff99,
    icon: '⛊⟿',
    components: ['shield', 'teleport'],
    effect: {
      type: 'invulnerable',
      duration: 5,
      description: 'Become temporarily invulnerable and able to pass through enemies'
    }
  }
};

/**
 * Helper function to get PowerStone type from component powers
 * @param {string} power1 - First power type
 * @param {string} power2 - Second power type
 * @returns {string|null} PowerStone type key or null if no matching combination
 */
export function getPowerStoneCombination(power1, power2) {
  // Ensure consistent ordering
  const powers = [power1, power2].sort();
  
  // Find matching combination
  for (const [key, stoneType] of Object.entries(powerStoneTypes)) {
    const components = [...stoneType.components].sort();
    if (powers[0] === components[0] && powers[1] === components[1]) {
      return key;
    }
  }
  
  // No matching combination found
  return null;
}

/**
 * ProjectilePool class for object pooling
 */
export class ProjectilePool {
  constructor(THREE, scene, capacity = 50) {
    this.THREE = THREE;
    this.scene = scene;
    this.capacity = capacity;
    this.pool = [];
    this.activeCount = 0;
    
    // Pre-create projectiles
    this.initializePool();
  }
  
  /**
   * Initialize pool with inactive projectiles
   */
  initializePool() {
    for (let i = 0; i < this.capacity; i++) {
      const geometry = new this.THREE.SphereGeometry(0.2, 8, 8);
      const material = new this.THREE.MeshBasicMaterial({ color: 0xffffff });
      const projectile = new this.THREE.Mesh(geometry, material);
      
      projectile.visible = false;
      projectile.userData = {
        active: false,
        velocity: new this.THREE.Vector3(),
        damage: 0,
        power: '',
        ttl: 0
      };
      
      this.scene.add(projectile);
      this.pool.push(projectile);
    }
  }
  
  /**
   * Get an available projectile from the pool
   * @returns {THREE.Mesh|null} Projectile or null if none available
   */
  getProjectile() {
    // Find an inactive projectile
    for (let i = 0; i < this.capacity; i++) {
      const projectile = this.pool[i];
      if (!projectile.userData.active) {
        projectile.visible = true;
        projectile.userData.active = true;
        this.activeCount++;
        return projectile;
      }
    }
    
    // No projectiles available
    return null;
  }
  
  /**
   * Return a projectile to the pool
   * @param {THREE.Mesh} projectile - The projectile to release
   */
  releaseProjectile(projectile) {
    projectile.visible = false;
    projectile.userData.active = false;
    this.activeCount--;
  }
  
  /**
   * Update all active projectiles
   * @param {Object} gameState - Current game state
   * @param {Array} enemies - Array of enemies
   * @param {Function} damageEnemy - Function to damage enemies
   */
  updateProjectiles(gameState, enemies, damageEnemy) {
    for (let i = 0; i < this.pool.length; i++) {
      const projectile = this.pool[i];
      
      if (projectile.userData.active) {
        // Move projectile
        projectile.position.add(projectile.userData.velocity);
        
        // Check lifetime
        projectile.userData.ttl--;
        if (projectile.userData.ttl <= 0) {
          this.releaseProjectile(projectile);
          continue;
        }
        
        // Check for enemy hits
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          const distance = getDistance(projectile.position, enemy.position);
          
          if (distance < 1) {
            // Hit enemy
            damageEnemy(enemy, projectile.userData.damage);
            this.releaseProjectile(projectile);
            break;
          }
        }
      }
    }
  }
}

/**
 * Fire the current power
 * @param {THREE} THREE - THREE.js library
 * @param {Object} gameState - Current game state
 * @param {THREE.Camera} camera - Player camera
 * @param {Object} projectilePool - Projectile pool
 * @param {Function} updateHUD - Function to update HUD
 * @param {Function} showWardenMessage - Function to show warden message
 */
export function firePower(THREE, gameState, camera, projectilePool, updateHUD, showWardenMessage) {
  // Check if game is started
  if (!gameState.started || gameState.paused) return;
  
  // Get current power
  const powerIndex = gameState.currentPower;
  const power = gameState.powers[powerIndex];
  
  // Check if power exists
  if (!power) {
    if (showWardenMessage) {
      showWardenMessage("No power equipped in this slot");
    }
    return;
  }
  
  // Check cooldown
  const now = Date.now();
  const type = power.type;
  const powerType = powerTypes[type];
  
  if (!powerType) {
    console.error(`Power type ${type} not found`);
    return;
  }
  
  const cooldown = powerType.cooldown || ATTACK_COOLDOWN;
  
  if (now - gameState.lastAttackTime < cooldown) {
    return;
  }
  
  // Check ammo
  const cost = power.cost || powerType.cost || POWER_COST.bullet;
  
  if (gameState.ammo < cost) {
    if (showWardenMessage) {
      showWardenMessage("Not enough energy");
    }
    return;
  }
  
  // Handle special case: teleport
  if (type === 'teleport') {
    handleTeleport(THREE, gameState, camera, power, updateHUD, showWardenMessage);
    
    // Play teleport sound effect
    if (gameState.audioManager && gameState.audioManager.initialized) {
      gameState.audioManager.playSound('shoot_teleport');
    }
    
    return;
  }
  
  // Handle special case: multi-shot powers
  if (powerType.multiShot) {
    fireMultipleProjectiles(THREE, gameState, camera, projectilePool, updateHUD, power, powerType.multiShot);
    
    // Play appropriate sound effect for multi-shot power
    if (gameState.audioManager && gameState.audioManager.initialized) {
      gameState.audioManager.playSound(`shoot_${type}`, { volume: 0.8 });
    }
    
    return;
  }
  
  // Standard projectile
  const projectile = projectilePool.getProjectile();
  
  if (!projectile) {
    console.warn("No projectile available in pool");
    return;
  }
  
  // Set projectile properties
  projectile.material.color.setHex(powerType.color);
  
  // Position at camera
  projectile.position.copy(camera.position);
  
  // Set direction based on camera
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  
  // Set velocity
  projectile.userData.velocity = direction.multiplyScalar(power.speed || powerType.speed || 1.0);
  projectile.userData.damage = power.damage || powerType.damage || 10;
  projectile.userData.power = type;
  projectile.userData.ttl = 60; // Time to live in frames
  
  // Consume ammo
  gameState.ammo = Math.max(0, gameState.ammo - cost);
  gameState.lastAttackTime = now;
  
  // Create muzzle flash
  createMuzzleFlashEffect(THREE, camera, powerType.color);
  
  // Update HUD
  updateHUD();
  
  // Play appropriate sound effect
  if (gameState.audioManager && gameState.audioManager.initialized) {
    gameState.audioManager.playSound(`shoot_${type}`, { volume: 0.8 });
  }
}

/**
 * Fire multiple projectiles in a spread pattern
 * @param {THREE} THREE - THREE.js library
 * @param {Object} gameState - Current game state
 * @param {THREE.Camera} camera - Player camera
 * @param {ProjectilePool} projectilePool - Projectile object pool
 * @param {Function} updateHUD - Function to update HUD
 * @param {Object} power - Power to fire
 * @param {number} count - Number of projectiles to fire
 * @returns {boolean} Whether the power was fired successfully
 */
function fireMultipleProjectiles(THREE, gameState, camera, projectilePool, updateHUD, power, count) {
  let success = false;
  const now = Date.now();
  
  // Create multiple projectiles
  for (let i = 0; i < count; i++) {
    const projectile = projectilePool.getProjectile();
    if (!projectile) continue;
    
    // Set projectile properties
    projectile.position.copy(camera.position);
    
    // Calculate spread angle (middle projectile goes straight)
    const angleOffset = (i - Math.floor(count / 2)) * 0.1;
    
    // Get direction with offset
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Apply spread
    direction.x += angleOffset;
    direction.normalize();
    
    projectile.userData.velocity = direction.multiplyScalar(power.speed);
    projectile.userData.damage = power.damage * 0.8; // Reduced damage for spread shots
    projectile.userData.power = power.name.toLowerCase();
    projectile.userData.ttl = 60;
    
    // Apply colors - blend power color with powerstone color
    const stoneColor = gameState.powerStone.color;
    const powerColor = power.color;
    
    const blendedColor = new THREE.Color(powerColor);
    const stoneColorThree = new THREE.Color(stoneColor);
    blendedColor.lerp(stoneColorThree, 0.5);
    
    projectile.material.color.set(blendedColor);
    
    success = true;
  }
  
  if (success) {
    // Update game state
    gameState.ammo -= power.cost * 1.2; // Slightly more cost for spread
    gameState.lastAttackTime = now;
    
    // Create visual effect
    createMuzzleFlashEffect(THREE, camera, power.color);
    
    // Update UI
    updateHUD();
  }
  
  return success;
}

/**
 * Handle teleport power
 */
function handleTeleport(THREE, gameState, camera, power, updateHUD, showWardenMessage) {
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const teleportDistance = TELEPORT_DISTANCE;
  
  // Calculate new position
  const newPosition = camera.position.clone().add(
    direction.multiplyScalar(teleportDistance)
  );
  
  // Teleport player
  camera.position.copy(newPosition);
  
  // Use ammo
  gameState.ammo -= power.cost;
  gameState.lastAttackTime = Date.now();
  
  // Create visual effect
  createTeleportEffect(THREE, camera, power.color);
  
  // Update UI
  updateHUD();
  showWardenMessage("Teleported");
  
  return true;
}

/**
 * Check for power absorption
 * @param {THREE} THREE - THREE.js library
 * @param {Object} gameState - Current game state
 * @param {THREE.Camera} camera - Player camera
 * @param {Function} damageEnemy - Function to damage enemy
 * @param {Function} updatePowerSlots - Function to update power slots
 * @param {Function} showWardenMessage - Function to show warden message
 */
export function checkPowerAbsorption(THREE, gameState, camera, damageEnemy, updatePowerSlots, showWardenMessage) {
  // Cast ray from camera
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  
  // Create raycaster
  const raycaster = new THREE.Raycaster(camera.position, direction, 0, ABSORB_RANGE);
  
  // Get enemies - unfortunately we have to check all of them
  const enemies = gameState.enemies || [];
  
  // Find closest enemy in range
  let closestEnemy = null;
  let minDistance = Infinity;
  
  enemies.forEach(enemy => {
    const distance = getDistance(camera.position, enemy.position);
    
    if (distance <= ABSORB_RANGE && distance < minDistance) {
      closestEnemy = enemy;
      minDistance = distance;
    }
  });
  
  // If no enemy in range, show message
  if (!closestEnemy) {
    if (showWardenMessage) {
      showWardenMessage("No enemy in absorption range");
    }
    return;
  }
  
  // Get enemy power
  const powerToAbsorb = closestEnemy.userData.power;
  
  // Check if already have this power
  const powerExists = gameState.powers.some(p => p && p.type === powerToAbsorb);
  
  if (powerExists) {
    // Already have this power, deal damage instead
    damageEnemy(closestEnemy, 20, gameState);
    if (showWardenMessage) {
      showWardenMessage(`Already have ${powerToAbsorb} power. Dealt 20 damage instead.`);
    }
    return;
  }
  
  // Find empty slot or replace current power
  let slot = gameState.powers.indexOf(null);
  if (slot === -1) {
    // No empty slot, replace current power
    slot = gameState.currentPower;
  }
  
  // Create absorption effect
  createAbsorptionEffect(THREE, closestEnemy.position, powerTypes[powerToAbsorb].color);
  
  // Play absorption sound
  if (gameState.audioManager && gameState.audioManager.initialized) {
    gameState.audioManager.playSound('power_absorb');
  }
  
  // Deal damage to enemy
  damageEnemy(closestEnemy, 5, gameState);
  
  // Absorb power
  gameState.powers[slot] = {
    type: powerToAbsorb,
    damage: powerTypes[powerToAbsorb].damage,
    speed: powerTypes[powerToAbsorb].speed,
    cooldown: powerTypes[powerToAbsorb].cooldown,
    cost: powerTypes[powerToAbsorb].cost
  };
  
  // Update UI
  if (updatePowerSlots) {
    updatePowerSlots();
  }
  
  // Show message
  if (showWardenMessage) {
    showWardenMessage(`Absorbed ${powerToAbsorb} power in slot ${slot + 1}`);
  }
}

/**
 * Create muzzle flash effect
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Camera} camera - Player camera
 * @param {number} color - Effect color
 */
export function createMuzzleFlashEffect(THREE, camera, color) {
  // Make sure camera is part of a scene
  if (!camera || !camera.parent) {
    console.warn("Cannot create muzzle flash effect: camera or camera.parent is null");
    return;
  }

  // Create a point light
  const light = new THREE.PointLight(color, 2, 10);
  light.position.copy(camera.position);
  
  // Move it slightly forward
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  light.position.add(direction.multiplyScalar(1));
  
  // Add to scene
  camera.parent.add(light);
  
  // Remove after a short delay
  setTimeout(() => {
    if (camera.parent) {
      camera.parent.remove(light);
    }
  }, 100);
}

/**
 * Create teleport effect
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Camera} camera - Player camera
 * @param {number} color - Effect color
 */
export function createTeleportEffect(THREE, camera, color) {
  // Make sure camera is part of a scene
  if (!camera || !camera.parent) {
    console.warn("Cannot create teleport effect: camera or camera.parent is null");
    return;
  }

  // Create a sphere at the original position
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.7
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(camera.position);
  
  // Add to scene
  camera.parent.add(sphere);
  
  // Animate sphere
  let scale = 1.0;
  let opacity = 0.7;
  
  const animate = () => {
    scale += 0.2;
    opacity -= 0.05;
    
    sphere.scale.set(scale, scale, scale);
    material.opacity = opacity;
    
    if (opacity > 0) {
      requestAnimationFrame(animate);
    } else {
      if (camera.parent) {
        camera.parent.remove(sphere);
      }
    }
  };
  
  animate();
}

/**
 * Create absorption effect
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Vector3} position - Effect position
 * @param {number} color - Effect color
 */
export function createAbsorptionEffect(THREE, position, color) {
  // Show absorption indicator in UI
  const absorptionIndicator = document.getElementById('absorptionIndicator');
  if (absorptionIndicator) {
    absorptionIndicator.style.borderColor = '#' + color.toString(16).padStart(6, '0');
    absorptionIndicator.style.display = 'block';
    
    // Hide after delay
    setTimeout(() => {
      absorptionIndicator.style.display = 'none';
    }, 1000);
  }
  
  // We need a scene to add particles - get it from the game
  const scene = document.querySelector('canvas')?.parentElement?.__scene;
  if (!scene) {
    console.warn("Cannot create absorption effect: scene not found");
    return;
  }
  
  // Create particle effect
  const particles = new THREE.Group();
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    
    const particle = new THREE.Mesh(geometry, material);
    
    // Random position around the enemy
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 1;
    particle.position.set(
      position.x + Math.cos(angle) * radius,
      position.y + Math.random() * 2,
      position.z + Math.sin(angle) * radius
    );
    
    particles.add(particle);
    
    // Set animation properties
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.1,
        (Math.random() - 0.5) * 0.05
      ),
      life: 30 + Math.random() * 30
    };
  }
  
  // Add to scene
  scene.add(particles);
  
  // Animate particles
  const animate = () => {
    let allDead = true;
    
    for (let i = 0; i < particles.children.length; i++) {
      const particle = particles.children[i];
      
      // Move particle
      particle.position.add(particle.userData.velocity);
      
      // Fade out
      particle.userData.life--;
      particle.material.opacity = particle.userData.life / 60;
      
      if (particle.userData.life > 0) {
        allDead = false;
      }
    }
    
    if (!allDead) {
      requestAnimationFrame(animate);
    } else {
      scene.remove(particles);
    }
  };
  
  animate();
}

/**
 * Create PowerStone activation effect
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Vector3} position - Effect position
 * @param {number} color - Effect color
 */
export function createPowerStoneEffect(THREE, position, color) {
  // We need a scene to add particles - get it from the game
  const scene = document.querySelector('canvas')?.parentElement?.__scene;
  if (!scene) {
    console.warn("Cannot create PowerStone effect: scene not found");
    return;
  }
  
  // Create expanding ring effect
  const rings = new THREE.Group();
  const ringCount = 3;
  
  for (let i = 0; i < ringCount; i++) {
    // Create ring geometry
    const geometry = new THREE.RingGeometry(0.1, 0.3, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    
    // Orient ring to face upward
    ring.rotation.x = -Math.PI / 2;
    
    // Add some random rotation for variety
    ring.rotation.z = Math.random() * Math.PI * 2;
    
    rings.add(ring);
    
    // Set animation properties with staggered timing
    ring.userData = {
      scale: 0.1,
      growSpeed: 0.15 + (i * 0.05),
      delay: i * 10,
      life: 60 + (i * 5)
    };
  }
  
  // Add particles for sparkle effect
  const particles = new THREE.Group();
  const particleCount = 15;
  
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    
    const particle = new THREE.Mesh(geometry, material);
    
    // Random position around the center
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 1;
    particle.position.set(
      position.x + Math.cos(angle) * radius,
      position.y + 0.5 + Math.random() * 1,
      position.z + Math.sin(angle) * radius
    );
    
    particles.add(particle);
    
    // Set animation properties
    particle.userData = {
      velocity: new THREE.Vector3(
        Math.cos(angle) * (0.05 + Math.random() * 0.05),
        0.1 + Math.random() * 0.1,
        Math.sin(angle) * (0.05 + Math.random() * 0.05)
      ),
      life: 40 + Math.random() * 20
    };
  }
  
  // Combine effects
  const effectGroup = new THREE.Group();
  effectGroup.add(rings);
  effectGroup.add(particles);
  scene.add(effectGroup);
  
  // Animate the effect
  const animate = () => {
    let allDead = true;
    
    // Animate rings
    for (let i = 0; i < rings.children.length; i++) {
      const ring = rings.children[i];
      
      // Skip if still in delay
      if (ring.userData.delay > 0) {
        ring.userData.delay--;
        allDead = false;
        continue;
      }
      
      // Grow ring
      ring.userData.scale += ring.userData.growSpeed;
      ring.scale.set(ring.userData.scale, ring.userData.scale, 1);
      
      // Fade out
      ring.userData.life--;
      ring.material.opacity = ring.userData.life / 60;
      
      if (ring.userData.life > 0) {
        allDead = false;
      }
    }
    
    // Animate particles
    for (let i = 0; i < particles.children.length; i++) {
      const particle = particles.children[i];
      
      // Move particle
      particle.position.add(particle.userData.velocity);
      
      // Fade out
      particle.userData.life--;
      particle.material.opacity = particle.userData.life / 40;
      
      if (particle.userData.life > 0) {
        allDead = false;
      }
    }
    
    if (!allDead) {
      requestAnimationFrame(animate);
    } else {
      scene.remove(effectGroup);
    }
  };
  
  animate();
}
