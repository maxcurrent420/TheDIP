# Level Design & Procedural Generation Guide (DimensionalInterceptPatrol) - v3 (Preventative Focus)

This guide outlines the steps to generate random, connected, maze-like levels using Randomized Prim's Algorithm and convert them into Three.js geometry, focusing on preventing common errors like the "gray screen".

## 1. Core Concepts

*   **Boundaries:** The level exists within `LEVEL_SIZE` x `LEVEL_SIZE`. Outer edges *must* be solid walls.
*   **Grid Representation:** Use a 2D array `grid[y][x]`. `1` = Wall, `0` = Floor.
*   **Cell Size:** Define `cellSize`. Grid dimensions: `gridWidth = Math.floor(LEVEL_SIZE / cellSize)`, `gridHeight = Math.floor(LEVEL_SIZE / cellSize)`.
*   **Connectivity:** All Floor cells must be reachable from the start.
*   **Randomness:** Use `Math.random()` for variety (e.g., choosing frontier cells).
*   **Geometry:** Convert the final `grid` into `THREE.BoxGeometry` for walls.

## 2. Coordinate Systems: Grid vs. World (Critical Checkpoint)

*   **Grid:** `(x, y)` indices. `grid[0][0]` = top-left. `x` right, `y` down.
*   **World:** `(x, y, z)` coordinates. `x` right, `y` up, `z` out of screen.
*   **Mapping:**
    *   Grid `x` -> World `x`
    *   Grid `y` -> World `z`
    *   World `y` -> Height (e.g., `WALL_HEIGHT / 2` for wall center)
*   **Centering Formula (Preventing Offset Errors):** To place a wall mesh corresponding to `grid[y][x]`:
    *   `worldX = (x * cellSize) - (LEVEL_SIZE / 2) + (cellSize / 2)`
    *   `worldY = WALL_HEIGHT / 2`
    *   `worldZ = (y * cellSize) - (LEVEL_SIZE / 2) + (cellSize / 2)`
    *   *(Ensure `LEVEL_SIZE` and `cellSize` are correctly defined and used here)*

## 3. Algorithm: Randomized Prim's (Implementation Steps)

1.  **Initialization (Preventing Incorrect Start):**
    *   Create `grid[gridHeight][gridWidth]`.
    *   **Fill COMPLETELY with `1` (Wall).** This is crucial.
    *   Create an empty array `frontier`.

2.  **Starting Point (Preventing Out-of-Bounds):**
    *   Choose `startX`, `startY` (e.g., `Math.floor(gridWidth / 2)`, `Math.floor(gridHeight / 2)`).
    *   **Verify:** `0 <= startX < gridWidth` and `0 <= startY < gridHeight`.
    *   Mark `grid[startY][startX] = 0` (Floor).
    *   **Add Initial Frontier:** Find wall neighbors exactly **2 steps** away (`nx = startX +/- 2`, `ny = startY +/- 2`).
        *   For each potential neighbor `(nx, ny)`:
            *   **Verify:** `0 <= nx < gridWidth` and `0 <= ny < gridHeight`.
            *   If valid, add `{ x: nx, y: ny, fromX: startX, fromY: startY }` to `frontier`.

3.  **Growing the Maze (Preventing Logic Errors):**
    *   **While `frontier` has elements:**
        *   Select a **random** index `randIdx` from `0` to `frontier.length - 1`.
        *   Get the cell data: `wall = frontier[randIdx]`.
        *   **Remove** the selected cell from `frontier` (e.g., `frontier.splice(randIdx, 1)`).
        *   Calculate the cell **between** the wall and its origin:
            *   `betweenX = wall.x + (wall.fromX - wall.x) / 2`
            *   `betweenY = wall.y + (wall.fromY - wall.y) / 2`
            *   *(These calculations should result in integers because the distance is 2)*
        *   **Verify Indices:** Check that `wall.x`, `wall.y`, `betweenX`, `betweenY` are all within valid grid bounds (`0` to `gridWidth/Height - 1`).
        *   **Check if Target is Wall:** **If `grid[wall.y][wall.x] === 1`:**
            *   Mark `grid[wall.y][wall.x] = 0` (Floor).
            *   Mark `grid[betweenY][betweenX] = 0` (Floor).
            *   **Add New Frontier:** Find wall neighbors of `(wall.x, wall.y)` exactly **2 steps** away (`nnx`, `nny`).
                *   For each potential new neighbor `(nnx, nny)`:
                    *   **Verify:** `0 <= nnx < gridWidth` and `0 <= nny < gridHeight`.
                    *   **Verify:** `grid[nny][nnx] === 1` (Ensure it's still a wall).
                    *   If valid and a wall, add `{ x: nnx, y: nny, fromX: wall.x, fromY: wall.y }` to `frontier`.

4.  **Ensuring Boundaries (Preventing Player Escape):**
    *   After the loop, explicitly set the border cells to walls:
        *   `for (let i = 0; i < gridWidth; i++) { grid[0][i] = 1; grid[gridHeight - 1][i] = 1; }`
        *   `for (let i = 0; i < gridHeight; i++) { grid[i][0] = 1; grid[i][gridWidth - 1] = 1; }`

## 4. Converting Grid to Three.js Geometry (Preventing Rendering Errors)

1.  Iterate through `grid` from `y = 0` to `gridHeight - 1` and `x = 0` to `gridWidth - 1`.
2.  **If `grid[y][x] === 1`:**
    *   Calculate `worldX`, `worldY`, `worldZ` using the **exact centering formula** from Section 2.
    *   Create `geometry = new THREE.BoxGeometry(cellSize, WALL_HEIGHT, cellSize)`.
    *   Create `material` (ensure `gameState.textures.wall` is loaded *before* this step).
    *   Create `wallMesh = new THREE.Mesh(geometry, material)`.
    *   Set `wallMesh.position.set(worldX, worldY, worldZ)`.
    *   Add `wallMesh` to the `scene` and `gameState.levelObjects`.
3.  **If `grid[y][x] === 0`:**
    *   This is floor space. The main floor/ceiling planes cover this.
    *   Optionally, place pillars, ensuring they don't block paths or the spawn point.

## 5. Final Checks Before Running

*   Ensure `THREE`, `scene`, `gameState`, `LEVEL_SIZE`, `WALL_HEIGHT`, `cellSize`, and textures are correctly passed to or accessible by the level generation function.
*   Ensure the player's starting position (`camera.position`) is set *after* level generation to coordinates corresponding to a known Floor cell (e.g., the `startX`, `startY` used in the algorithm, converted to world coordinates).

By meticulously following these steps, focusing on correct initialization, bounds checking, algorithm logic, and coordinate conversion, the generation process should produce a valid level structure and render correctly, preventing the gray screen issue.
