# The Dimensional Intercept Patrol

A first-person shooter game with dimensional shifting and power absorption mechanics.

## Project Overview

The Dimensional Intercept Patrol is a browser-based 3D game built with Three.js. Players navigate between dimensions, absorb powers from enemies, and protect the multiverse from dimensional anomalies.

## Gameplay Features

- **Dimensional Shifting**: Toggle between 4 different dimensions (Prime, Void, Nexus, Quantum) that affect visuals and gameplay.
- **Power Absorption**: Defeat enemies to absorb their powers.
- **Multiple Powers**: Use different powers like bullets, fireballs, ice shards, shield, and teleportation.
- **Progressive Difficulty**: Enemies increase in number and challenge as you advance through levels.

## Controls

- **Movement**: WASD or Arrow Keys
- **Look**: Mouse
- **Shoot**: Left Mouse Button
- **Absorb Power**: Right Mouse Button or E key
- **Switch Powers**: 1, 2, 3 keys
- **Shift Dimension**: Q key
- **Pause**: ESC key

## Project Structure

The codebase has been modularized according to Phase 1 of the development roadmap:

```
src/
  ├── constants.js      # Game constants
  ├── enemy.js          # Enemy class and related functions
  ├── game.js           # Main game loop and initialization
  ├── index.js          # Entry point
  ├── levelManager.js   # Level generation and management
  ├── player.js         # Player class and controls
  ├── powerManager.js   # Power definitions and projectile pool
  ├── textureLoader.js  # Texture loading and caching
  ├── textures.js       # Texture data
  ├── uiManager.js      # UI updates and interactions
  └── utils.js          # Utility functions
```

## Technical Improvements

### Phase 1 Implementations:

1. **Modularization**: Code split into logical modules.
2. **Object Pooling**: Implemented for projectiles to reduce garbage collection.
3. **External Texture Loading**: Base64 texture data moved to a separate file.
4. **Code Cleanup**: Improved naming, comments, and organization.
5. **Proximity Check Optimization**: Optimized enemy updates based on distance from player.

## Development Roadmap

The project follows a phased development approach:

1. **Phase 1: Core Refactoring and Architecture** (Completed)
   - Modularization
   - Object Pooling
   - External Texture Loading
   - Code Cleanup
   - Performance Optimizations

2. **Phase 2: Enhanced Visuals and Gameplay** (Planned)
   - Texture Atlases
   - Sprite-Based Enemies
   - Improved Level Generation
   - Enhanced Enemy AI
   - Sound Effects

3. **Phase 3: Advanced Features and Web3 Integration** (Future)
   - Debouncing/Throttling
   - More Sophisticated Collision Detection
   - Level Design Features
   - Web3 Integration (DIP tokens, power NFTs)

4. **Phase 4: Build Process and Optimization** (Future)
   - Modern Build Process
   - Performance Profiling
   - Further Optimization

## Running the Game

Simply open the `DIP.html` file in a modern web browser that supports JavaScript modules and WebGL. No additional build steps are required for development.

## Credits

- **Engine**: Three.js
- **Development**: Max Current

---

The Dimensional Intercept Patrol - Navigate between dimensions. Absorb powers. Protect the multiverse.
