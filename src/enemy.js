// Enemy module
import * as THREE from 'three';
import { ENEMY_ATTACK_RANGE, ENEMY_ATTACK_COOLDOWN, ENEMY_DAMAGE_AMOUNT, ENEMY_UPDATE_RADIUS, HEALTH_PICKUP_VALUE } from './constants.js';
import { getRandomInt, getDistance } from './utils.js';

// Enemy type definitions
export const enemyTypes = [
  {
    name: 'Sentinel',
    color: 0xff0000,
    health: 50,
    damage: 10,
    speed: 0.03,
    power: 'bullet'
  },
  {
    name: 'Pyro',
    color: 0xff6600,
    health: 30,
    damage: 15,
    speed: 0.03,
    power: 'fireball'
  },
  {
    name: 'Frost',
    color: 0x66ccff,
    health: 40,
    damage: 12,
    speed: 0.03,
    power: 'ice'
  },
  {
    name: 'Sonar',
    color: 0x9966ff,
    health: 35,
    damage: 8,
    speed: 0.03,
    power: 'sonic'
  },
  {
    name: 'Guardian',
    color: 0x00ff00,
    health: 80,
    damage: 10,
    speed: 0.025,
    power: 'shield'
  },
  {
    name: 'Shifter',
    color: 0xff00ff,
    health: 45,
    damage: 12,
    speed: 0.03,
    power: 'teleport'
  }
];

/**
 * Creates an enemy
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Vector3} position - Enemy position
 * @param {string} dimension - Current dimension
 * @returns {THREE.Mesh} Enemy mesh
 */
export function createEnemy(THREE, position, dimension) {
  // Choose a random enemy type
  const enemyType = enemyTypes[getRandomInt(0, enemyTypes.length - 1)];
  
  // Create enemy mesh
  const geometry = new THREE.BoxGeometry(1, 2, 1);
  const material = new THREE.MeshLambertMaterial({ color: enemyType.color });
  const enemy = new THREE.Mesh(geometry, material);
  
  // Set position
  enemy.position.copy(position);
  
  // Add user data
  enemy.userData = {
    type: enemyType.name,
    health: enemyType.health,
    maxHealth: enemyType.health,
    damage: enemyType.damage,
    speed: enemyType.speed,
    power: enemyType.power,
    lastAttackTime: 0,
    healthBar: null,
    healthBarBg: null
  };
  
  // Create health bar
  createHealthBar(THREE, enemy);
  
  return enemy;
}

/**
 * Create a health bar for an enemy
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Mesh} enemy - Enemy mesh
 */
export function createHealthBar(THREE, enemy) {
  // Background bar
  const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
  const bgMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  });
  
  const healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
  healthBarBg.position.set(0, 1.5, 0);
  healthBarBg.rotation.x = Math.PI / 2;
  enemy.add(healthBarBg);
  enemy.userData.healthBarBg = healthBarBg;
  
  // Health fill
  const fillGeometry = new THREE.PlaneGeometry(1, 0.1);
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3e3e,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  
  const healthBar = new THREE.Mesh(fillGeometry, fillMaterial);
  healthBar.position.set(0, 0.01, 0);
  healthBarBg.add(healthBar);
  enemy.userData.healthBar = healthBar;
  
  // Update the health bar
  updateHealthBar(enemy);
}

/**
 * Updates an enemy's health bar
 * @param {THREE.Mesh} enemy - Enemy mesh
 */
export function updateHealthBar(enemy) {
  const healthPercent = enemy.userData.health / enemy.userData.maxHealth;
  enemy.userData.healthBar.scale.x = Math.max(0.01, healthPercent);
  
  // Center the bar
  enemy.userData.healthBar.position.x = (healthPercent - 1) / 2;
  
  // Change color based on health
  if (healthPercent < 0.3) {
    enemy.userData.healthBar.material.color.setHex(0xff0000);
  } else if (healthPercent < 0.6) {
    enemy.userData.healthBar.material.color.setHex(0xffff00);
  } else {
    enemy.userData.healthBar.material.color.setHex(0xff3e3e);
  }
}

/**
 * Create a health pickup
 * @param {THREE} THREE - THREE.js library
 * @param {Object} position - Pickup position with x, y, z properties
 * @param {THREE.Scene} scene - Game scene
 * @param {Array} levelObjects - Array to store level objects
 * @returns {THREE.Mesh} Health pickup mesh
 */
export function createHealthPickup(THREE, position, scene, levelObjects) {
  // Basic parameter verification
  if (!THREE || !position || !scene || !levelObjects) {
    console.error('createHealthPickup: Missing required parameters');
    return null;
  }

  // Ensure we have proper x,y,z properties
  if (typeof position !== 'object' || !('x' in position) || !('y' in position) || !('z' in position)) {
    console.error('Invalid position object:', position);
    return null;
  }
  
  const x = position.x;
  const y = position.y;
  const z = position.z;
  
  console.log(`Creating health pickup at position: x=${x}, y=${y}, z=${z}`);
  
  // Create a health pickup sphere
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
  const pickup = new THREE.Mesh(geometry, material);
  
  // Set position directly using extracted coordinates
  pickup.position.set(x, 1.0, z); // Always set y to 1.0 for visibility
  
  // Add required user data
  pickup.userData = {
    type: 'healthPickup',
    value: HEALTH_PICKUP_VALUE,
    rotationSpeed: 0.05
  };
  
  // Add to scene
  scene.add(pickup);
  
  // Add to level objects array
  levelObjects.push(pickup);
  
  console.log('Health pickup created and added to scene');
  
  return pickup;
}

/**
 * Spawn enemies in the level
 * @param {THREE} THREE - THREE.js library
 * @param {number} count - Number of enemies to spawn
 * @param {THREE.Camera} camera - Player camera
 * @param {Array} enemies - Array of enemies
 * @param {THREE.Scene} scene - Game scene
 * @param {string} dimension - Current dimension
 * @param {number} levelSize - Size of the level
 * @param {number} spawnDistance - Minimum distance from player to spawn
 * @returns {Array} - Spawned enemies
 */
export function spawnEnemies(THREE, count, camera, enemies, scene, dimension, levelSize, spawnDistance) {
  const spawnedEnemies = [];
  
  // Type checking and fixes for input parameters
  console.log(`spawnEnemies raw input - count:`, count, `type:`, typeof count);
  
  // Ensure we have a valid THREE library
  if (!THREE || typeof THREE !== 'object') {
    console.error('Invalid THREE library passed to spawnEnemies');
    return spawnedEnemies;
  }
  
  // Ensure count is a number
  if (typeof count !== 'number') {
    console.warn(`Invalid count parameter passed to spawnEnemies:`, count);
    try {
      // Try to convert to number
      count = parseInt(count);
      if (isNaN(count)) {
        count = 1; // Default to 1 if conversion fails
      }
    } catch (e) {
      count = 1; // Default to 1 if conversion fails
    }
  }
  
  // Ensure we have a valid enemies array
  if (!Array.isArray(enemies)) {
    console.warn('Invalid enemies array passed to spawnEnemies, creating new array');
    enemies = [];
  }
  
  // Limit total active enemies to 6 at a time
  const maxEnemies = 6;
  const currentEnemyCount = enemies.length;
  
  console.log(`spawnEnemies normalized - count: ${count}, currentEnemyCount: ${currentEnemyCount}, maxEnemies: ${maxEnemies}`);
  
  // If we already have the maximum number of enemies, don't spawn more
  if (currentEnemyCount >= maxEnemies) {
    console.log('Maximum enemy count reached, not spawning more');
    return spawnedEnemies;
  }
  
  // Calculate how many enemies we can spawn without exceeding the limit
  const availableSlots = maxEnemies - currentEnemyCount;
  const enemiesCount = Math.min(count, availableSlots);
  
  console.log(`Attempting to spawn ${enemiesCount} enemies (available slots: ${availableSlots})`);
  
  // Ensure we have all required parameters
  if (!camera || !scene || !dimension) {
    console.error('Missing required parameters in spawnEnemies');
    return spawnedEnemies;
  }
  
  // Use sensible defaults for optional parameters
  levelSize = levelSize || 40;
  spawnDistance = spawnDistance || 15;
  
  for (let i = 0; i < enemiesCount; i++) {
    // Generate random position away from player
    let position;
    let distanceToPlayer;
    let attempts = 0;
    const maxAttempts = 20; // Limit attempts to avoid infinite loop
    
    do {
      // Random position within level bounds
      const x = getRandomInt(-levelSize / 2, levelSize / 2);
      const z = getRandomInt(-levelSize / 2, levelSize / 2);
      position = new THREE.Vector3(x, 1, z);
      
      // Ensure we have valid camera position for distance check
      if (camera && camera.position) {
        // Check distance to player
        distanceToPlayer = getDistance(position, camera.position);
      } else {
        // No camera position, just use a random position
        distanceToPlayer = spawnDistance + 1; // Ensure loop exits
      }
      
      attempts++;
      
      if (attempts >= maxAttempts) {
        console.warn(`Could not find valid spawn position after ${maxAttempts} attempts`);
        break;
      }
    } while (distanceToPlayer < spawnDistance);
    
    // If we couldn't find a valid position, skip this enemy
    if (attempts >= maxAttempts) continue;
    
    // Create enemy
    const enemy = createEnemy(THREE, position, dimension);
    
    // Add to scene and enemies array
    scene.add(enemy);
    enemies.push(enemy);
    spawnedEnemies.push(enemy);
    
    console.log(`Spawned enemy ${i+1}/${enemiesCount} at position:`, position);
  }
  
  console.log(`Successfully spawned ${spawnedEnemies.length} enemies, new total: ${enemies.length}`);
  return spawnedEnemies;
}

/**
 * Update enemies
 * @param {THREE.Camera} camera - Player camera
 * @param {Array} enemies - Array of enemies
 * @param {Object} gameState - Current game state
 * @param {Function} damagePlayer - Function to damage player
 */
export function updateEnemies(camera, enemies, gameState, damagePlayer) {
  const now = Date.now();
  
  // Ensure camera is valid before cloning its position
  if (!camera || !camera.position) {
    console.warn('Camera or camera position is undefined in updateEnemies');
    return;
  }
  
  const playerPosition = camera.position.clone();
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    
    // Skip invalid enemies
    if (!enemy || !enemy.position) continue;
    
    const distanceToPlayer = getDistance(enemy.position, playerPosition);
    
    // Only update enemies within a certain radius of the player
    if (distanceToPlayer < ENEMY_UPDATE_RADIUS) {
      // Look at player
      enemy.lookAt(playerPosition);
      
      // Move towards player
      if (distanceToPlayer > ENEMY_ATTACK_RANGE) {
        // Calculate direction to player
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, enemy.position)
          .normalize();
        
        // Store current position
        const currentPosition = enemy.position.clone();
        
        // Move in that direction
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed));
        
        // Check for wall collisions
        let collision = false;
        for (let j = 0; j < gameState.levelObjects.length; j++) {
          const object = gameState.levelObjects[j];
          if (!object || !object.userData || object.userData.type === 'healthPickup') continue;
          
          const box = new THREE.Box3().setFromObject(object);
          box.expandByScalar(1); // Enemy radius
          
          if (box.containsPoint(enemy.position)) {
            collision = true;
            break;
          }
        }
        
        // Check for enemy collisions
        for (let j = 0; j < enemies.length; j++) {
          if (i === j) continue;
          const otherEnemy = enemies[j];
          if (!otherEnemy) continue;
          
          const distance = enemy.position.distanceTo(otherEnemy.position);
          if (distance < 2) { // Combined radius of two enemies
            collision = true;
            break;
          }
        }
        
        // If collision detected, revert position
        if (collision) {
          enemy.position.copy(currentPosition);
        }
      }
      
      // Attack player if close enough and cooldown has passed
      if (distanceToPlayer <= ENEMY_ATTACK_RANGE && 
          (enemy.userData.lastAttack === undefined || now - enemy.userData.lastAttack > ENEMY_ATTACK_COOLDOWN)) {
        // Update last attack time
        enemy.userData.lastAttack = now;
        
        // Damage player
        if (typeof damagePlayer === 'function') {
          damagePlayer(ENEMY_DAMAGE_AMOUNT);
        }
      }
      
      // Update health bar to face camera
      if (enemy.userData.healthBarBg) {
        enemy.userData.healthBarBg.lookAt(camera.position);
      }
    }
  }
}

/**
 * Damage an enemy
 * @param {THREE.Mesh} enemy - Enemy to damage
 * @param {number} damage - Damage amount
 * @param {Object} gameState - Current game state
 * @param {THREE} THREE - THREE.js library
 * @param {THREE.Scene} scene - Game scene
 * @param {Function} createHealthPickupFn - Function to create health pickup
 * @param {Function} spawnEnemiesFn - Function to spawn more enemies
 * @param {Function} nextLevel - Function to advance to next level
 * @param {Function} updateKillCounter - Function to update kill counter
 * @returns {boolean} Whether the enemy was killed
 */
export function damageEnemy(enemy, damage, gameState, THREE, scene, createHealthPickupFn, spawnEnemiesFn, nextLevel, updateKillCounter) {
  if (!enemy || !enemy.userData) return false;
  
  enemy.userData.health -= damage;
  updateHealthBar(enemy);
  
  // Play damage sound
  if (gameState.audioManager && gameState.audioManager.initialized) {
    gameState.audioManager.playSound('enemy_damage', { volume: 0.7 });
  }
  
  // Check if enemy died
  if (enemy.userData.health <= 0) {
    // Play death sound
    if (gameState.audioManager && gameState.audioManager.initialized) {
      gameState.audioManager.playSound('enemy_death');
    }
    
    // Update counters
    gameState.enemiesDefeated++;
    gameState.totalEnemiesDefeated++;
    updateKillCounter();
    
    // Reward DIP tokens for defeating enemy
    if (gameState.dipTokens !== undefined && gameState.merchGenie) {
      const tokenReward = gameState.DIP_TOKEN_REWARD_PER_ENEMY || 5;
      gameState.merchGenie.rewardTokens(tokenReward);
    }
    
    // Add enemy power to absorbed powers if not already present
    if (enemy.userData.power && gameState.absorbedPowers) {
      const powerType = enemy.userData.power;
      const powerExists = gameState.absorbedPowers.some(p => p.type === powerType);
      
      if (!powerExists) {
        gameState.absorbedPowers.push({
          type: powerType,
          damage: getEnemyPowerDamage(powerType),
          cost: getEnemyPowerCost(powerType),
          speed: getEnemyPowerSpeed(powerType),
          enhanced: false
        });
        
        if (gameState.showWardenMessage) {
          gameState.showWardenMessage(`Absorbed ${powerType} power!`);
        }
      }
    }
    
    // Check for level completion
    if (gameState.enemiesDefeated >= gameState.levelEnemyCount) {
      nextLevel();
    }
    
    // Get enemy position BEFORE removing it
    // Create a plain object with x, y, z properties
    const enemyPosition = {
      x: enemy.position.x,
      y: enemy.position.y, 
      z: enemy.position.z
    };
    
    console.log('Enemy killed at position:', enemyPosition);
    
    // Create health pickup with the position object
    const pickup = createHealthPickupFn(THREE, enemyPosition, scene, gameState.levelObjects);
    console.log('Health pickup creation result:', pickup ? 'Success' : 'Failed');
    
    // Remove enemy from scene
    if (scene) {
      scene.remove(enemy);
    }
    
    // Remove enemy from gameState.enemies array
    const index = gameState.enemies ? gameState.enemies.indexOf(enemy) : -1;
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    
    // Spawn new enemy after a short delay if not at max level enemy count
    // and we haven't reached the level's total enemy count
    setTimeout(() => {
      // Calculate how many enemies are REMAINING (not spawned yet)
      const remainingEnemies = Math.max(0, gameState.levelEnemyCount - gameState.enemiesDefeated);
      const currentEnemies = gameState.enemies ? gameState.enemies.length : 0;
      
      console.log('Spawning check - Current enemies:', currentEnemies);
      console.log('Spawning check - Enemies defeated:', gameState.enemiesDefeated);
      console.log('Spawning check - Level enemy count:', gameState.levelEnemyCount);
      console.log('Spawning check - Remaining enemies to spawn:', remainingEnemies);
      
      // Only spawn more enemies if there are more enemies to defeat in this level
      // and we don't have the maximum number of enemies (6) already
      if (gameState.enemies && 
          remainingEnemies > 0 && 
          currentEnemies < 6) {
        console.log('Spawning new enemy to replace killed enemy');
        
        // Spawn up to the number of available slots or remaining enemies (whichever is smaller)
        const availableSlots = 6 - currentEnemies;
        const toSpawn = Math.min(availableSlots, remainingEnemies);
        
        console.log(`Spawning ${toSpawn} enemies (Current: ${currentEnemies}, Available slots: ${availableSlots}, Remaining: ${remainingEnemies})`);
        
        if (toSpawn > 0) {
          try {
            // Call the spawn function directly to avoid any issues with function references
            spawnEnemies(
              THREE, 
              toSpawn, // Make sure this is a number
              gameState.camera,
              gameState.enemies,
              scene,
              gameState.dimension,
              gameState.levelSize || 40,
              gameState.enemySpawnDistance || 20
            );
          } catch (error) {
            console.error('Error in direct spawnEnemies call:', error);
          }
        }
      }
    }, 1000); // 1 second delay before spawning replacement
    
    return true;
  }
  
  return false;
}

/**
 * Get enemy power damage
 * @param {string} powerType - Power type
 * @returns {number} Damage value
 */
function getEnemyPowerDamage(powerType) {
  switch (powerType) {
    case 'bullet': return 10;
    case 'fireball': return 20;
    case 'ice': return 15;
    case 'sonic': return 12;
    case 'shield': return 5;
    case 'teleport': return 10;
    default: return 10;
  }
}

/**
 * Get enemy power cost
 * @param {string} powerType - Power type
 * @returns {number} Cost value
 */
function getEnemyPowerCost(powerType) {
  switch (powerType) {
    case 'bullet': return 5;
    case 'fireball': return 15;
    case 'ice': return 10;
    case 'sonic': return 5;
    case 'shield': return 20;
    case 'teleport': return 25;
    default: return 10;
  }
}

/**
 * Get enemy power speed
 * @param {string} powerType - Power type
 * @returns {number} Speed value
 */
function getEnemyPowerSpeed(powerType) {
  switch (powerType) {
    case 'bullet': return 0.5;
    case 'fireball': return 0.3;
    case 'ice': return 0.4;
    case 'sonic': return 0.6;
    case 'shield': return 0.2;
    case 'teleport': return 0.7;
    default: return 0.4;
  }
}
