# DevPlan.md: The Dimensional Inception Phase - Development Roadmap

This document outlines the phased development plan for refactoring and expanding "The Dimensional Inception Phase."  It prioritizes maintainability, performance, and the addition of new features.

## Phase 1: Core Refactoring and Architecture (Immediate Priorities)

**Goal:**  Establish a solid, modular foundation for future development.  Address immediate redundancies and performance bottlenecks.

**Tasks:**

1.  **Modularization (Critical):**  Break the monolithic JavaScript code into separate modules/classes.  This is the highest priority for long-term maintainability.  Create these files:

    *   `src/game.js`:  Main game loop, initialization, overall game state management.  Handles `gameState`, `animate`, `startGame`, `initGame`, level transitions, and high-level event handling.
    *   `src/player.js`:  Player class.  Manages player state (health, ammo, position, powers), movement controls (`onKeyDown`, `onKeyUp`), firing (`firePower`), and taking damage.
    *   `src/enemy.js`:  Enemy class.  Manages enemy state (health, position, type, power), AI, movement, attacking, and taking damage (`damageEnemy`). Includes the `createHealthBar` and `updateHealthBar` functions.
    *   `src/levelManager.js`:  Handles level generation (`generateLevel`, `clearLevel`, `createFloor`, `createCeiling`, `createWalls`, `createPillar`, `createLighting`), dimension shifting (`shiftDimension`, `createDimensionShiftEffect`, `applyDimensionEffects`, `regenerateTextures`), and spawning entities (`spawnEnemies`, `createHealthPickup`).
    *   `src/uiManager.js`:  Handles all HUD updates (`updateHUD`, `updatePowerSlots`, `updateKillCounter`, `showLevelIndicator`), messages (`showWardenMessage`), and other UI elements (start menu, instructions, death screen, crosshair, absorption indicator).
    *   `src/powerManager.js`:  Handles power definitions (`powerTypes`), firing logic, absorption logic (`checkPowerAbsorption`), and visual effects related to powers (`createMuzzleFlashEffect`, `createTeleportEffect`, `createAbsorptionEffect`).
    *   `src/utils.js`: Utility functions like `showError`, and any other helper functions that don't fit neatly into other modules.
    *   `src/constants.js`:  Defines all game constants (e.g., `ATTACK_COOLDOWN`, `RESPAWN_DELAY`, `TELEPORT_DISTANCE`, `ENEMY_UPDATE_RADIUS`, etc.).
    *  `src/textureLoader.js`: Responsible for asychronously loading and caching textures, as well as for managing texture atlases, and loading them from an external file/files.

2.  **Object Pooling (High Priority):** Implement object pooling for projectiles. This significantly reduces garbage collection overhead.  Create a `ProjectilePool` within `src/powerManager.js` (since projectiles are closely tied to powers). The pool should have `getProjectile()` and `releaseProjectile()` methods.  Modify `firePower` to use the pool.

3.  **External Texture Loading (High Priority):**

Create a new src/textures.js file to store the file paths to your .png texture assets (located in the src/assets/ directory). This file acts as a central index of your textures.

Modify src/textureLoader.js to:

Import the file paths from src/textures.js.

Use THREE.TextureLoader (within the loadTexture function) to asynchronously load the actual texture data from the specified file paths.

Store the loaded THREE.Texture objects in the textureStore. This makes them accessible to the rest of your game.

Implement texture caching within loadTexture

4.  **Code Cleanup (Medium Priority):**
    *   Remove any remaining redundant code (ensure the `createWall` and `createPillar` improvements from the previous review are fully integrated).
    *   Consistently use `const` and `let` (avoid `var`).
    *   Improve comments where necessary to explain complex logic.

5. **Proximity check for enemies (Medium Priority):** Refactor the `updateEnemies` function in `src/enemy.js` to incorporate the optimization of distance check.

## Phase 2: Enhanced Visuals and Gameplay

**Goal:** Improve the visual fidelity and introduce more engaging gameplay mechanics.

**Tasks:**

1.  **Texture Atlases (High Priority):** Implement texture atlases (spritesheets) for walls, floors, and ceilings.  Modify `src/textureLoader.js` to handle atlas loading and UV mapping. This will require updating the relevant geometry creation functions (`createFloor`, `createCeiling`, `createWalls`, `createPillar`) in `src/levelManager.js` to use the correct UV coordinates from the atlas.

2.  **Sprite-Based Enemies (High Priority):**  Replace the cube-based enemies with 2D sprites (like DOOM/HEXEN).
    *   Create a sprite sheet for each enemy type.
    *   Modify the `Enemy` class in `src/enemy.js` to use `THREE.Sprite` and `THREE.SpriteMaterial`.
    *   Implement animation by cycling through frames on the sprite sheet within the `updateEnemies` function.  This will likely involve adding animation-related properties to the enemy's `userData`.
    *   Ensure the health bar logic still works correctly with sprites.

3.  **Improved Level Generation (Medium Priority):**  Explore more advanced procedural level generation techniques in `src/levelManager.js`.  Consider:
    *   Using Perlin noise or similar algorithms to create more organic layouts.
    *   Adding different room types and connecting corridors.
    *   Implementing a system for placing props and decorations.

4.  **Enhanced Enemy AI (Medium Priority):**  Expand the enemy AI in `src/enemy.js`.  Consider:
    *   Pathfinding (A* or a simpler alternative).
    *   Different attack patterns based on enemy type and distance to the player.
    *   Enemy-specific behaviors (e.g., some enemies might flee, others might charge).

5.  **Sound Effects (Medium Priority):** Add basic sound effects for player actions (shooting, taking damage, shifting dimensions), enemy actions, and ambient sounds. Use the Web Audio API or a lightweight sound library.

## Phase 3: Advanced Features and Web3 Integration

**Goal:** Introduce more complex game mechanics and integrate with Web3 technologies.

**Tasks:**

1.  **Debouncing/Throttling (High Priority):** Implement debouncing or throttling for actions like dimension shifting to prevent rapid activations. This can be added to `src/player.js` as part of the input handling.

2.  **More Sophisticated Collision Detection (Medium Priority):** Evaluate the need for a more robust collision detection system. If the current distance checks are insufficient for complex level designs or interactions, consider:
    *   A simple bounding box/sphere collision library.
    *   A full physics engine (Cannon.js or Ammo.js) *only* if realistic physics are required.

3. **Level Design Features (Medium Priority):**
    *    Dimensional Puzzles: Implement level areas that require specific powers to access.
    *   Environment Interaction: Allow powers to interact with the environment (e.g., freezing water).
    *   Hidden Secrets: Add hidden areas with rewards.

4.  **Web3 Integration (High Priority - Required to fund further development):**
    *   Develop the "DIP" token system and smart contracts.
    *   Create the power-up NFT framework.
    *   Implement "MerchGenie" marketplace functionality for trading power NFTs.
    *   Integrate the fusion system for combining powers (using DIP tokens).
    ### Token System: "The DIP" (Dimensional Integrity Protocol)
- **Utility**: Used to buy special items and combine powers to create enhance absorbed powers, as well as NFTs that confer special benefits/priveliges.
- **Power NFTs**: Rare or unique powers can be converted to NFTs and traded using DIP tokens.
- **Storyline Integration**: The DIP token represents stabilized dimensional energy that helps maintain multiverse integrity.

## Phase 4: Build Process and Optimization

**Goal:**  Prepare the project for production and further optimization.

**Tasks:**

1.  **Modern Build Process (High Priority):**  Integrate a modern JavaScript build process (Parcel). This provides:
    *   Module bundling.
    *   Code transpilation (for wider browser compatibility).
    *   Minification and optimization for production.
    *   Potential for code splitting (loading only necessary modules for different parts of the game).

## Ongoing Considerations

*   **Testing:**  As features are added, write unit tests and integration tests to ensure code quality and prevent regressions.
*   **Documentation:** Keep the code well-documented, especially as it becomes more complex.
*   **Version Control:**  Use Git for version control and consider a branching strategy (e.g., Gitflow) for managing features and releases.
*   **Community Feedback:**  If possible, gather feedback from players throughout the development process to guide design decisions.

This roadmap provides a structured approach to refactoring and expanding your game. Remember that priorities and timelines can be adjusted based on your progress and feedback. The key is to build incrementally, test thoroughly, and maintain a clean and well-organized codebase.

server {
    listen 80;
    server_name game.yourdomain.com;
    
    root /var/www/game;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
