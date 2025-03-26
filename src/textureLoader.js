// Texture loader module
import * as THREE from 'three';
import texturePaths from './textures.js';

// Create a texture cache to avoid redundant loading
const textureCache = new Map();
const loadingPromises = new Map();

// Texture store for different dimensions
export const textureStore = {
  defaults: {
    floor: null,
    ceiling: null,
    wall: null
  },
  floors: {},
  ceilings: {},
  walls: {}
};

/**
 * Initializes textures for the game
 * @param {THREE} THREE - THREE.js library
 * @returns {Promise} - Promise that resolves when all textures are loaded
 */
export function initTextures(THREE) {
  console.log('Initializing textures...');
  return loadTexturesFromPaths(THREE, texturePaths);
}

/**
 * Loads textures from the provided paths
 * @param {THREE} THREE - THREE.js library
 * @param {Object} texturePaths - Object containing texture paths
 * @returns {Promise} - Promise that resolves when all textures are loaded
 */
function loadTexturesFromPaths(THREE, texturePaths) {
  console.log('Loading textures from paths:', texturePaths);
  
  const promises = [];
  
  // Load default textures
  if (texturePaths.defaults) {
    console.log('Loading default textures');
    promises.push(
      loadTexture(THREE, texturePaths.defaults.floor).then(texture => {
        textureStore.defaults.floor = texture;
      })
    );
    
    promises.push(
      loadTexture(THREE, texturePaths.defaults.ceiling).then(texture => {
        textureStore.defaults.ceiling = texture;
      })
    );
    
    promises.push(
      loadTexture(THREE, texturePaths.defaults.wall).then(texture => {
        textureStore.defaults.wall = texture;
      })
    );
  }

  // Set default textures for all dimensions
  for (const dimension in texturePaths.dimensions) {
    console.log(`Setting up textures for dimension: ${dimension}`);
    textureStore.floors[dimension] = textureStore.defaults.floor;
    textureStore.ceilings[dimension] = textureStore.defaults.ceiling;
    textureStore.walls[dimension] = textureStore.defaults.wall;
    
    // If dimension has specific textures, load those
    if (texturePaths.dimensions[dimension]) {
      if (texturePaths.dimensions[dimension].floor) {
        console.log(`Loading floor texture for ${dimension}`);
        promises.push(
          loadTexture(THREE, texturePaths.dimensions[dimension].floor).then(texture => {
            textureStore.floors[dimension] = texture;
          })
        );
      }
      if (texturePaths.dimensions[dimension].ceiling) {
        console.log(`Loading ceiling texture for ${dimension}`);
        promises.push(
          loadTexture(THREE, texturePaths.dimensions[dimension].ceiling).then(texture => {
            textureStore.ceilings[dimension] = texture;
          })
        );
      }
      if (texturePaths.dimensions[dimension].wall) {
        console.log(`Loading wall texture for ${dimension}`);
        promises.push(
          loadTexture(THREE, texturePaths.dimensions[dimension].wall).then(texture => {
            textureStore.walls[dimension] = texture;
          })
        );
      }
    }
  }
  
  return Promise.all(promises);
}

/**
 * Loads a texture from a file path with caching
 * @param {THREE} THREE - THREE.js library
 * @param {string} texturePath - Path to the texture file
 * @returns {Promise<THREE.Texture>} Promise that resolves with the loaded texture
 */
function loadTexture(THREE, texturePath) {
  if (!texturePath) return Promise.resolve(null);
  
  console.log(`Loading texture: ${texturePath}`);
  
  // Check cache first
  if (textureCache.has(texturePath)) {
    console.log(`Using cached texture for ${texturePath}`);
    return Promise.resolve(textureCache.get(texturePath));
  }
  
  // Check if already loading
  if (loadingPromises.has(texturePath)) {
    return loadingPromises.get(texturePath);
  }
  
  // Load new texture
  const loader = new THREE.TextureLoader();
  
  // Create a promise for loading
  const loadPromise = new Promise((resolve) => {
    loader.load(
      texturePath, 
      // onLoad callback
      (loadedTexture) => {
        console.log(`Successfully loaded texture: ${texturePath}`);
        
        // Set texture properties
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        
        // Adjust repeat based on texture path - walls should have less repetition
        if (texturePath.includes('wall')) {
          // For wall textures, use a smaller repeat factor to prevent stretching
          loadedTexture.repeat.set(1, 1);
        } else {
          // For other textures (floor, ceiling) keep original repeat value
          loadedTexture.repeat.set(4, 4);
        }
        
        // Cache it
        textureCache.set(texturePath, loadedTexture);
        loadingPromises.delete(texturePath);
        
        resolve(loadedTexture);
      },
      // onProgress callback
      undefined,
      // onError callback
      (err) => {
        console.error(`Error loading texture ${texturePath}:`, err);
        
        // Create a placeholder texture (1x1 colored pixel)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw checkerboard pattern as placeholder
        const squareSize = 8;
        for (let y = 0; y < canvas.height; y += squareSize) {
          for (let x = 0; x < canvas.width; x += squareSize) {
            ctx.fillStyle = ((x + y) % (squareSize * 2) === 0) ? '#444' : '#666';
            ctx.fillRect(x, y, squareSize, squareSize);
          }
        }
        
        // Create a fallback texture from canvas
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        fallbackTexture.wrapS = THREE.RepeatWrapping;
        fallbackTexture.wrapT = THREE.RepeatWrapping;
        
        // Adjust repeat based on texture path - walls should have less repetition
        if (texturePath.includes('wall')) {
          // For wall textures, use a smaller repeat factor to prevent stretching
          fallbackTexture.repeat.set(1, 1);
        } else {
          // For other textures (floor, ceiling) keep original repeat value
          fallbackTexture.repeat.set(4, 4);
        }
        
        // Cache the fallback texture
        textureCache.set(texturePath, fallbackTexture);
        loadingPromises.delete(texturePath);
        
        console.log(`Created fallback texture for ${texturePath}`);
        resolve(fallbackTexture);
      }
    );
  });
  
  // Store the loading promise
  loadingPromises.set(texturePath, loadPromise);
  
  return loadPromise;
}

/**
 * Regenerates textures for a given dimension
 * @param {string} dimension - Current dimension
 */
export function regenerateTextures(dimension) {
  console.log(`Regenerating textures for dimension: ${dimension}`);
  const current = dimension || 'prime';
  
  // Apply dimension-specific textures to the texture store
  textureStore.currentFloor = textureStore.floors[current] || textureStore.defaults.floor;
  textureStore.currentCeiling = textureStore.ceilings[current] || textureStore.defaults.ceiling;
  textureStore.currentWall = textureStore.walls[current] || textureStore.defaults.wall;
  
  // Log texture status
  console.log('Current texture status:', {
    floor: textureStore.currentFloor ? 'loaded' : 'missing',
    ceiling: textureStore.currentCeiling ? 'loaded' : 'missing',
    wall: textureStore.currentWall ? 'loaded' : 'missing'
  });
  
  // Add debugging check for the textures
  if (!textureStore.currentFloor || !textureStore.currentCeiling || !textureStore.currentWall) {
    console.warn('Some textures are missing! This will cause rendering issues.');
  }
  
  // Validate the textures have image data
  if (textureStore.currentFloor && (!textureStore.currentFloor.image || !textureStore.currentFloor.image.complete)) {
    console.warn('Floor texture not ready!');
  }
  
  if (textureStore.currentCeiling && (!textureStore.currentCeiling.image || !textureStore.currentCeiling.image.complete)) {
    console.warn('Ceiling texture not ready!');
  }
  
  if (textureStore.currentWall && (!textureStore.currentWall.image || !textureStore.currentWall.image.complete)) {
    console.warn('Wall texture not ready!');
  }
  
  // Force texture update
  if (textureStore.currentFloor) textureStore.currentFloor.needsUpdate = true;
  if (textureStore.currentCeiling) textureStore.currentCeiling.needsUpdate = true;
  if (textureStore.currentWall) textureStore.currentWall.needsUpdate = true;
  
  return {
    floor: textureStore.currentFloor,
    ceiling: textureStore.currentCeiling,
    wall: textureStore.currentWall
  };
}

/**
 * Creates a texture atlas from multiple textures
 * @param {THREE} THREE - THREE.js library
 * @param {Array} textures - Array of texture objects with source and position info
 * @param {number} width - Atlas width
 * @param {number} height - Atlas height
 * @returns {THREE.Texture} Atlas texture
 */
export function createTextureAtlas(THREE, textures, width, height) {
  // Create a canvas to draw the atlas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  
  // Load all images
  const promises = textures.map(texture => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ img, texture });
      img.onerror = reject;
      img.src = texture.src;
    });
  });
  
  // After all images are loaded, draw them on canvas
  return Promise.all(promises).then(results => {
    results.forEach(({ img, texture }) => {
      context.drawImage(img, texture.x, texture.y, texture.width, texture.height);
    });
    
    // Create texture from canvas
    const atlas = new THREE.Texture(canvas);
    atlas.needsUpdate = true;
    
    return atlas;
  });
}
