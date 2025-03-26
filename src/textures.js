// Texture paths store
// This file contains all the texture file paths

export default {
  // Default textures for all dimensions
  defaults: {
    floor: 'textures/default_floor.png',
    ceiling: 'textures/default_ceiling.png',
    wall: 'textures/default_wall.png'
  },
  
  // Dimension-specific textures
  dimensions: {
    prime: {
      // Prime dimension uses defaults
    },
    void: {
      floor: 'textures/void_floor.png',
      ceiling: 'textures/void_ceiling.png',
      wall: 'textures/void_wall.png'
    },
    nexus: {
      floor: 'textures/nexus_floor.png',
      ceiling: 'textures/nexus_ceiling.png',
      wall: 'textures/nexus_wall.png'
    },
    quantum: {
      floor: 'textures/quantum_floor.png',
      ceiling: 'textures/quantum_ceiling.png',
      wall: 'textures/quantum_wall.png'
    }
  }
};
