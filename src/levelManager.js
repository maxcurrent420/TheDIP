// Level Manager module
import { LEVEL_SIZE, WALL_HEIGHT, PILLAR_PROBABILITY, DIMENSIONS, MAX_AMMO, DIP_TOKEN_REWARD_PER_LEVEL } from './constants.js';
import { getRandomInt } from './utils.js';
import { regenerateTextures } from './textureLoader.js';
import { spawnEnemies } from './enemy.js';

/**
 * Level Manager class
 */
export class LevelManager {
  constructor(THREE, scene, gameState) {
    this.THREE = THREE;
    this.scene = scene;
    this.gameState = gameState;
    
    // Bind methods
    this.generateLevel = this.generateLevel.bind(this);
    this.clearLevel = this.clearLevel.bind(this);
    this.createFloor = this.createFloor.bind(this);
    this.createCeiling = this.createCeiling.bind(this);
    this.createWalls = this.createWalls.bind(this);
    this.createPillar = this.createPillar.bind(this);
    this.createLighting = this.createLighting.bind(this);
    this.shiftDimension = this.shiftDimension.bind(this);
    this.applyDimensionEffects = this.applyDimensionEffects.bind(this);
    this.nextLevel = this.nextLevel.bind(this);
  }
  
  /**
   * Generate a new level
   * @param {number} level - Level number
   */
  generateLevel(level) {
    // Clear previous level objects
    this.clearLevel();
    
    // Create floor, ceiling and walls
    this.createFloor();
    this.createCeiling();
    this.createWalls(level);
    
    // Create lighting
    this.createLighting(level);
    
    // Initialize or reset enemies array
    this.gameState.enemies = this.gameState.enemies || [];
    
    // Make sure we start with an empty enemies array
    while (this.gameState.enemies.length > 0) {
      const enemy = this.gameState.enemies.pop();
      if (enemy && this.scene) {
        this.scene.remove(enemy);
      }
    }
    
    // Update level data
    this.gameState.level = level;
    this.gameState.enemiesDefeated = 0;
    
    // The initial level should require 10 enemies, and subsequent levels should have 10 + level * 2
    const totalEnemiesForLevel = (level === 1) ? 10 : (10 + level * 2);
    this.gameState.levelEnemyCount = totalEnemiesForLevel;
    
    console.log(`Generating level ${level} with ${totalEnemiesForLevel} total enemies`);
    
    // Spawn initial enemies (up to 6 at a time)
    const initialSpawnCount = Math.min(6, totalEnemiesForLevel);
    console.log(`Initial spawn: ${initialSpawnCount} enemies`);
    
    spawnEnemies(
      this.THREE,
      initialSpawnCount,
      this.gameState.camera,
      this.gameState.enemies,
      this.scene,
      this.gameState.dimension,
      LEVEL_SIZE,
      this.gameState.enemySpawnDistance
    );
    
    this.gameState.currentKillName = this.gameState.killNames[(level - 1) % this.gameState.killNames.length];
    
    // Update HUD
    this.gameState.updateKillCounter();
  }
  
  /**
   * Clear the current level
   */
  clearLevel() {
    // Remove all level objects
    for (let i = this.gameState.levelObjects.length - 1; i >= 0; i--) {
      this.scene.remove(this.gameState.levelObjects[i]);
    }
    this.gameState.levelObjects = [];
    
    // Clear enemies
    for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
      this.scene.remove(this.gameState.enemies[i]);
    }
    this.gameState.enemies = [];
    
    // Clear projectiles
    for (let i = this.gameState.projectiles.length - 1; i >= 0; i--) {
      this.scene.remove(this.gameState.projectiles[i]);
    }
    this.gameState.projectiles = [];
  }
  
  /**
   * Create the floor
   */
  createFloor() {
    // Create a floor that extends beyond the level boundaries
    const floorSize = LEVEL_SIZE * 2; // Double the size to ensure no void areas
    const geometry = new this.THREE.PlaneGeometry(floorSize, floorSize);
    const material = new this.THREE.MeshLambertMaterial({ 
      map: this.gameState.textures.floor 
    });
    
    // Set texture repeat to maintain proper scale
    if (material.map) {
      material.map = material.map.clone();
      material.map.repeat.set(2, 2); // Repeat texture to cover larger floor
      material.map.needsUpdate = true;
    }
    material.needsUpdate = true;
    
    const floor = new this.THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    
    // Add userData to make floor collidable
    floor.userData = {
      type: 'floor'
    };
    
    this.scene.add(floor);
    this.gameState.levelObjects.push(floor);
  }
  
  /**
   * Create the ceiling
   */
  createCeiling() {
    // Match ceiling size to floor size
    const ceilingSize = LEVEL_SIZE * 2;
    const geometry = new this.THREE.PlaneGeometry(ceilingSize, ceilingSize);
    const material = new this.THREE.MeshLambertMaterial({ 
      map: this.gameState.textures.ceiling 
    });
    
    // Set texture repeat to maintain proper scale
    if (material.map) {
      material.map = material.map.clone();
      material.map.repeat.set(2, 2); // Repeat texture to cover larger ceiling
      material.map.needsUpdate = true;
    }
    material.needsUpdate = true;
    
    const ceiling = new this.THREE.Mesh(geometry, material);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    
    this.scene.add(ceiling);
    this.gameState.levelObjects.push(ceiling);
  }
  
  /**
   * Create walls and obstacles
   * @param {number} level - Level number
   */
  createWalls(level) {
    // First, create the outer boundary of the level
    const halfSize = LEVEL_SIZE / 2;
    
    // Create base perimeter walls to ensure level has full boundary
    this.createWall(-halfSize, 0, 0, LEVEL_SIZE, 0);        // Left wall
    this.createWall(halfSize, 0, 0, LEVEL_SIZE, Math.PI);   // Right wall
    this.createWall(0, 0, -halfSize, LEVEL_SIZE, Math.PI/2); // Back wall
    this.createWall(0, 0, halfSize, LEVEL_SIZE, -Math.PI/2); // Front wall
    
    // Create more consistent outer environment to prevent visible voids
    // Instead of separate grid of floor tiles, create a continuous floor outside the main play area
    const outerFloorSize = LEVEL_SIZE * 3; // Much larger outer floor
    const outerFloorGeometry = new this.THREE.PlaneGeometry(outerFloorSize, outerFloorSize);
    
    const outerFloorMaterial = new this.THREE.MeshLambertMaterial({
      map: this.gameState.textures.floor
    });
    
    if (outerFloorMaterial.map) {
      outerFloorMaterial.map = outerFloorMaterial.map.clone();
      outerFloorMaterial.map.repeat.set(outerFloorSize/10, outerFloorSize/10);
      outerFloorMaterial.map.wrapS = this.THREE.RepeatWrapping;
      outerFloorMaterial.map.wrapT = this.THREE.RepeatWrapping;
      outerFloorMaterial.map.needsUpdate = true;
    }
    
    // Create a single outer floor positioned under the main floor
    const outerFloor = new this.THREE.Mesh(outerFloorGeometry, outerFloorMaterial);
    outerFloor.rotation.x = -Math.PI / 2;
    outerFloor.position.set(0, -0.1, 0); // Slightly below main floor to prevent z-fighting
    outerFloor.userData = {
      type: 'outerFloor'
    };
    this.scene.add(outerFloor);
    this.gameState.levelObjects.push(outerFloor);
    
    // Create a more structured barrier around the main level
    const wallExtensions = 3;
    const wallGap = 10; // Space between wall segments
    const outerWallThickness = 4;
    
    // Create four large outer walls as a boundary box
    const outerWalls = [
      // North wall
      { x: 0, z: -halfSize - wallGap, length: LEVEL_SIZE + 2*outerWallThickness, rotation: Math.PI/2 },
      // South wall
      { x: 0, z: halfSize + wallGap, length: LEVEL_SIZE + 2*outerWallThickness, rotation: -Math.PI/2 },
      // East wall
      { x: halfSize + wallGap, z: 0, length: LEVEL_SIZE + 2*wallGap, rotation: Math.PI },
      // West wall
      { x: -halfSize - wallGap, z: 0, length: LEVEL_SIZE + 2*wallGap, rotation: 0 }
    ];
    
    // Create the outer walls
    for (const wall of outerWalls) {
      // Use a thicker geometry for outer walls
      const geometry = new this.THREE.BoxGeometry(wall.length, WALL_HEIGHT * 1.5, outerWallThickness);
      const material = new this.THREE.MeshLambertMaterial({ 
        map: this.gameState.textures.wall 
      });
      
      // Set texture with proper repeats
      if (material.map) {
        material.map = material.map.clone();
        
        // Set repeat values based on wall dimensions
        const TEXEL_DENSITY = 1/4;
        material.map.repeat.set(wall.length * TEXEL_DENSITY, WALL_HEIGHT * 1.5 * TEXEL_DENSITY);
        material.map.wrapS = this.THREE.RepeatWrapping;
        material.map.wrapT = this.THREE.RepeatWrapping;
        material.map.needsUpdate = true;
      }
      
      material.needsUpdate = true;
      
      const outerWall = new this.THREE.Mesh(geometry, material);
      outerWall.position.set(wall.x, (WALL_HEIGHT * 1.5) / 2, wall.z);
      outerWall.rotation.y = wall.rotation;
      outerWall.userData = { type: 'outerWall' };
      
      this.scene.add(outerWall);
      this.gameState.levelObjects.push(outerWall);
    }
    
    // For level 1, create a simple room layout with guaranteed paths
    if (level === 1) {
      this.createSimpleRoomLayout();
      return;
    }
    
    // For higher levels, create more complex procedural layouts
    this.createComplexRoomLayout(level);
  }
  
  /**
   * Create a simple room layout for the first level
   * Ensures the player has easy access to all areas
   */
  createSimpleRoomLayout() {
    const halfSize = LEVEL_SIZE / 2;
    const roomSize = LEVEL_SIZE / 4;
    
    // Create a central hub with 4 rooms connected by corridors
    // Central area is left open for player spawn
    
    // Room 1 (top-right)
    this.createWall(roomSize, 0, -roomSize, roomSize * 1.5, 0);
    this.createWall(roomSize * 2, 0, -roomSize * 1.5, roomSize, Math.PI/2);
    
    // Room 2 (bottom-right)
    this.createWall(roomSize, 0, roomSize, roomSize * 1.5, 0);
    this.createWall(roomSize * 2, 0, roomSize * 1.5, roomSize, -Math.PI/2);
    
    // Room 3 (bottom-left)
    this.createWall(-roomSize, 0, roomSize, roomSize * 1.5, Math.PI);
    this.createWall(-roomSize * 2, 0, roomSize * 1.5, roomSize, -Math.PI/2);
    
    // Room 4 (top-left)
    this.createWall(-roomSize, 0, -roomSize, roomSize * 1.5, Math.PI);
    this.createWall(-roomSize * 2, 0, -roomSize * 1.5, roomSize, Math.PI/2);
    
    // Add some pillars in each room for cover
    this.createPillar(roomSize * 1.5, 0, -roomSize * 1.5);
    this.createPillar(roomSize * 1.5, 0, roomSize * 1.5);
    this.createPillar(-roomSize * 1.5, 0, roomSize * 1.5);
    this.createPillar(-roomSize * 1.5, 0, -roomSize * 1.5);
  }
  
  /**
   * Create a more complex room layout for higher levels
   * Uses a grid-based approach to ensure rooms are connected
   * @param {number} level - Level number for scaling difficulty
   */
  createComplexRoomLayout(level) {
    // Grid size increases with level (3x3 minimum, 5x5 maximum)
    const gridSize = Math.min(5, 2 + Math.floor(level / 3));
    const cellSize = LEVEL_SIZE / gridSize;
    const halfLevel = LEVEL_SIZE / 2;
    const halfCell = cellSize / 2;
    
    // Create a grid representation where 1 = wall, 0 = open
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
      const row = [];
      for (let j = 0; j < gridSize; j++) {
        row.push(1); // Start with all walls
      }
      grid.push(row);
    }
    
    // Ensure center cell is open for player spawn
    const center = Math.floor(gridSize / 2);
    grid[center][center] = 0;
    
    // Use a more robust maze generation algorithm to create connected rooms
    // Start from the center and work outward using a depth-first approach
    const stack = [{x: center, y: center}];
    const visited = {};
    visited[`${center},${center}`] = true;
    
    // Direction vectors: up, right, down, left
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];
    
    // Create a fully connected path through the grid
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      
      // Find unvisited neighbors
      const neighbors = [];
      for (let dir = 0; dir < 4; dir++) {
        const nx = current.x + dx[dir];
        const ny = current.y + dy[dir];
        
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && 
            !visited[`${nx},${ny}`]) {
          neighbors.push({x: nx, y: ny, dir: dir});
        }
      }
      
      if (neighbors.length > 0) {
        // Choose a random unvisited neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Mark the cell as visited and open
        visited[`${next.x},${next.y}`] = true;
        grid[next.y][next.x] = 0;
        
        // Move to the next cell
        stack.push({x: next.x, y: next.y});
      } else {
        // No unvisited neighbors, backtrack
        stack.pop();
      }
    }
    
    // Add more openings to ensure better connectivity
    // Higher chance for openings in higher levels for more complex layouts
    const additionalOpenings = Math.floor(level / 2) + 2; // Increased from +1 to +2
    
    // Track cell accessibility
    const accessibleCells = new Set();
    accessibleCells.add(`${center},${center}`);
    
    // Add connections to ensure all areas are accessible
    const connectIsolatedCells = () => {
      let madeChanges = false;
      
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          // Skip walls
          if (grid[y][x] === 1) continue;
          
          // Check if this cell is already accessible
          if (accessibleCells.has(`${x},${y}`)) continue;
          
          // Look for an accessible neighbor to connect to
          for (let dir = 0; dir < 4; dir++) {
            const nx = x + dx[dir];
            const ny = y + dy[dir];
            
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              if (accessibleCells.has(`${nx},${ny}`)) {
                // Connect to this accessible cell
                grid[y][x] = 0;
                accessibleCells.add(`${x},${y}`);
                madeChanges = true;
                break;
              }
            }
          }
        }
      }
      
      return madeChanges;
    };
    
    // Create random openings to add loops and complexity
    for (let i = 0; i < additionalOpenings; i++) {
      const x = getRandomInt(0, gridSize - 1);
      const y = getRandomInt(0, gridSize - 1);
      
      // Don't open cells at the center (already open) or boundary
      if ((x !== center || y !== center) && 
          x > 0 && x < gridSize - 1 && y > 0 && y < gridSize - 1) {
        grid[y][x] = 0;
        
        // Mark connected cells as accessible
        if (accessibleCells.size > 0) {
          for (let dir = 0; dir < 4; dir++) {
            const nx = x + dx[dir];
            const ny = y + dy[dir];
            
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              if (grid[ny][nx] === 0 && accessibleCells.has(`${nx},${ny}`)) {
                accessibleCells.add(`${x},${y}`);
                break;
              }
            }
          }
        }
      }
    }
    
    // Ensure all open cells are accessible
    let iterations = 0;
    const maxIterations = gridSize * gridSize;
    
    while (connectIsolatedCells() && iterations < maxIterations) {
      iterations++;
    }
    
    // Create the walls based on the grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x] === 1) { // This is a wall cell
          // Calculate world position
          const wx = (x - center) * cellSize;
          const wz = (y - center) * cellSize;
          
          // Create a box-shaped wall section
          const wallSize = cellSize * 0.9; // Slightly smaller than cell for visual gap
          const geometry = new this.THREE.BoxGeometry(wallSize, WALL_HEIGHT, wallSize);
          const material = new this.THREE.MeshLambertMaterial({ 
            map: this.gameState.textures.wall 
          });
          
          const wall = new this.THREE.Mesh(geometry, material);
          wall.position.set(wx, WALL_HEIGHT / 2, wz);
          
          this.scene.add(wall);
          this.gameState.levelObjects.push(wall);
        } else {
          // This is an open cell, maybe add a pillar or decorative element
          // Reduced chance for pillars to avoid blocking paths
          if (Math.random() < 0.2 * (level / 10)) {
            const wx = (x - center) * cellSize + getRandomInt(-halfCell/3, halfCell/3);
            const wz = (y - center) * cellSize + getRandomInt(-halfCell/3, halfCell/3);
            
            // Don't place pillars at the center spawn point or adjacent cells
            if ((Math.abs(x - center) > 1 || Math.abs(y - center) > 1) && Math.random() < 0.7) {
              this.createPillar(wx, 0, wz);
            }
          }
        }
      }
    }
  }
  
  /**
   * Create a wall
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {number} length - Wall length
   * @param {number} rotation - Wall rotation in radians
   */
  createWall(x, y, z, length, rotation) {
    // Create a thicker wall for better collision detection
    const wallThickness = 1.5;
    const geometry = new this.THREE.BoxGeometry(length, WALL_HEIGHT, wallThickness);
    const material = new this.THREE.MeshLambertMaterial({ 
      map: this.gameState.textures.wall 
    });
    
    // Set correct texture mapping to prevent stretching
    if (material.map) {
      material.map = material.map.clone(); // Clone the texture to avoid affecting other walls
      
      // Prevent texture stretching by using a fixed texel density
      // We'll use a fixed repeat size per unit to maintain consistent appearance
      const TEXEL_DENSITY = 1/4; // One repeat every 4 units
      
      if (rotation === 0 || rotation === Math.PI) {
        // For east-west walls
        material.map.repeat.set(length * TEXEL_DENSITY, WALL_HEIGHT * TEXEL_DENSITY);
        material.map.wrapS = this.THREE.RepeatWrapping;
        material.map.wrapT = this.THREE.RepeatWrapping;
      } else {
        // For north-south walls
        material.map.repeat.set(wallThickness * TEXEL_DENSITY, WALL_HEIGHT * TEXEL_DENSITY);
        material.map.wrapS = this.THREE.RepeatWrapping;
        material.map.wrapT = this.THREE.RepeatWrapping;
      }
      
      // Ensure texture is not flipped
      material.map.offset.set(0, 0);
      material.map.needsUpdate = true;
    }
    
    material.needsUpdate = true;
    
    const wall = new this.THREE.Mesh(geometry, material);
    wall.position.set(x, y + WALL_HEIGHT / 2, z);
    wall.rotation.y = rotation;
    
    // Add userData for collision detection and minimap
    wall.userData = {
      type: 'wall'
    };
    
    this.scene.add(wall);
    this.gameState.levelObjects.push(wall);
    
    return wall;
  }
  
  /**
   * Create a pillar
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   */
  createPillar(x, y, z) {
    const pillarSize = 2;
    const geometry = new this.THREE.BoxGeometry(pillarSize, WALL_HEIGHT, pillarSize);
    const material = new this.THREE.MeshLambertMaterial({ 
      map: this.gameState.textures.wall 
    });
    
    // Set correct texture mapping to prevent stretching
    if (material.map) {
      material.map = material.map.clone();
      
      // Set consistent texel density for all faces
      const TEXEL_DENSITY = 1/4; // One repeat every 4 units
      material.map.repeat.set(pillarSize * TEXEL_DENSITY, WALL_HEIGHT * TEXEL_DENSITY);
      material.map.wrapS = this.THREE.RepeatWrapping;
      material.map.wrapT = this.THREE.RepeatWrapping;
      material.map.needsUpdate = true;
    }
    
    material.needsUpdate = true;
    
    const pillar = new this.THREE.Mesh(geometry, material);
    pillar.position.set(x, y + WALL_HEIGHT / 2, z);
    
    // Add userData for collision detection and minimap
    pillar.userData = {
      type: 'pillar'
    };
    
    this.scene.add(pillar);
    this.gameState.levelObjects.push(pillar);
    
    return pillar;
  }
  
  /**
   * Create lighting for the level
   * @param {number} level - Level number
   */
  createLighting(level) {
    // Ambient light
    const ambientIntensity = 0.3;
    const ambientLight = new this.THREE.AmbientLight(0xffffff, ambientIntensity);
    this.scene.add(ambientLight);
    this.gameState.levelObjects.push(ambientLight);
    
    // Directional light
    const directionalLight = new this.THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, WALL_HEIGHT - 1, 0);
    this.scene.add(directionalLight);
    this.gameState.levelObjects.push(directionalLight);
    
    // Add some point lights around the level
    const lightColors = [0xffaaaa, 0xaaffaa, 0xaaaaff, 0xffffaa];
    const lightCount = Math.min(8, level * 2);
    
    for (let i = 0; i < lightCount; i++) {
      const color = lightColors[getRandomInt(0, lightColors.length - 1)];
      const intensity = 0.7 + Math.random() * 0.5;
      const distance = 10 + Math.random() * 5;
      
      const pointLight = new this.THREE.PointLight(color, intensity, distance);
      
      // Random position but not at the center
      let x, z;
      do {
        x = getRandomInt(-LEVEL_SIZE / 2 + 5, LEVEL_SIZE / 2 - 5);
        z = getRandomInt(-LEVEL_SIZE / 2 + 5, LEVEL_SIZE / 2 - 5);
      } while (Math.abs(x) < 5 && Math.abs(z) < 5);
      
      pointLight.position.set(x, WALL_HEIGHT - 1, z);
      
      this.scene.add(pointLight);
      this.gameState.levelObjects.push(pointLight);
    }
  }
  
  /**
   * Shift to another dimension
   */
  shiftDimension() {
    // Get current dimension index
    const currentIndex = DIMENSIONS.indexOf(this.gameState.dimension);
    
    // Shift to next dimension
    const nextIndex = (currentIndex + 1) % DIMENSIONS.length;
    this.gameState.dimension = DIMENSIONS[nextIndex];
    
    // Update UI
    this.gameState.updateDimensionIndicator(this.gameState.dimension);
    
    // Apply dimension effects
    this.applyDimensionEffects();
    
    // Regenerate textures
    this.gameState.textures = regenerateTextures(this.gameState.dimension);
    this.regenerateTextureObjects();
  }
  
  /**
   * Update textures on level objects
   */
  regenerateTextureObjects() {
    for (const object of this.gameState.levelObjects) {
      if (object.material && object.material.map) {
        // Check object type and assign appropriate texture
        if (object.rotation.x === -Math.PI / 2) {
          // Floor
          object.material.map = this.gameState.textures.floor;
        } else if (object.rotation.x === Math.PI / 2) {
          // Ceiling
          object.material.map = this.gameState.textures.ceiling;
        } else {
          // Walls and pillars
          object.material.map = this.gameState.textures.wall;
        }
        
        // Update material
        object.material.needsUpdate = true;
      }
    }
  }
  
  /**
   * Apply visual and gameplay effects based on dimension
   */
  applyDimensionEffects() {
    // Apply different visual effects based on dimension
    switch (this.gameState.dimension) {
      case 'prime':
        // Default
        this.scene.background = new this.THREE.Color(0x222222);
        this.scene.fog = new this.THREE.Fog(0x222222, 0, 50);
        document.body.style.filter = 'none';
        break;
        
      case 'void':
        // Dark purple dimension
        this.scene.background = new this.THREE.Color(0x110022);
        this.scene.fog = new this.THREE.Fog(0x110022, 5, 30);
        document.body.style.filter = 'saturate(0.7) contrast(1.2)';
        break;
        
      case 'nexus':
        // Bright blue dimension
        this.scene.background = new this.THREE.Color(0x001133);
        this.scene.fog = new this.THREE.Fog(0x001133, 10, 60);
        document.body.style.filter = 'saturate(1.3) hue-rotate(30deg)';
        break;
        
      case 'quantum':
        // Teal dimension
        this.scene.background = new this.THREE.Color(0x003344);
        this.scene.fog = new this.THREE.Fog(0x003344, 5, 40);
        document.body.style.filter = 'saturate(1.1) hue-rotate(-20deg) brightness(1.1)';
        break;
    }
    
    // Modify enemy speeds based on dimension
    this.gameState.enemies.forEach(enemy => {
      const baseSpeed = enemy.userData.speed;
      
      switch (this.gameState.dimension) {
        case 'prime':
          enemy.userData.speed = baseSpeed;
          break;
        case 'void':
          enemy.userData.speed = baseSpeed * 0.7;
          break;
        case 'nexus':
          enemy.userData.speed = baseSpeed * 1.2;
          break;
        case 'quantum':
          enemy.userData.speed = baseSpeed * (0.8 + Math.random() * 0.4);
          break;
      }
    });
  }
  
  /**
   * Advance to next level
   */
  nextLevel() {
    // Play level complete sound
    if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
      this.gameState.audioManager.playSound('level_complete');
    }
    
    // Increment level
    const nextLevel = this.gameState.level + 1;
    this.gameState.level = nextLevel;
    
    // Clear and regenerate textures for the new level
    this.gameState.regenerateTextures(this.gameState.dimension);
    
    // Generate new level
    this.generateLevel(nextLevel);
    
    // Reward DIP tokens for level completion
    if (this.gameState.dipTokens !== undefined && this.gameState.merchGenie) {
      const tokenReward = this.gameState.DIP_TOKEN_REWARD_PER_LEVEL || 50;
      this.gameState.merchGenie.rewardTokens(tokenReward);
    }
    
    // Spawn MerchGenie kiosks
    if (this.gameState.merchGenie) {
      // Add one kiosk per 3 levels, with a minimum of 1
      const kioskCount = Math.max(1, Math.floor(nextLevel / 3));
      this.gameState.merchGenie.spawnKiosks(kioskCount, LEVEL_SIZE);
    }
    
    // Reset player health if below 30
    if (this.gameState.health < 30) {
      this.gameState.health = 30;
      this.gameState.updateHUD();
    }
    
    // Update ammo to max
    this.gameState.ammo = MAX_AMMO;
    this.gameState.updateHUD();
    
    // Show level indicator
    this.gameState.showLevelIndicator(`Level ${nextLevel}`);
    
    // Show warden message
    this.gameState.showWardenMessage(`Level ${nextLevel} - Defeat ${this.gameState.levelEnemyCount} ${this.gameState.currentKillName}`);
  }
}
