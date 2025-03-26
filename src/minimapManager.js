import { LEVEL_SIZE } from './constants.js';
import * as THREE from 'three';

export class MinimapManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.canvas = document.getElementById('minimapCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.scale = 0.1875; // Increased by 25% from 0.15 for better detail visibility
    
    // Set canvas size - increased by 50%
    this.canvas.width = 225;  // 150 * 1.5
    this.canvas.height = 225; // 150 * 1.5
    
    // Resize the minimap container as well
    const minimapContainer = document.getElementById('minimap');
    if (minimapContainer) {
      minimapContainer.style.width = '225px';
      minimapContainer.style.height = '225px';
    }
    
    // Bind methods
    this.update = this.update.bind(this);
    this.drawWalls = this.drawWalls.bind(this);
    this.drawEnemies = this.drawEnemies.bind(this);
    this.drawPlayer = this.drawPlayer.bind(this);
    this.drawBackground = this.drawBackground.bind(this);
  }
  
  /**
   * Update the minimap
   */
  update() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw floor background
    this.drawBackground();
    
    // Draw walls
    this.drawWalls();
    
    // Draw enemies
    this.drawEnemies();
    
    // Draw player
    this.drawPlayer();
  }
  
  /**
   * Draw floor background
   */
  drawBackground() {
    // Draw the playable area boundary
    this.ctx.fillStyle = 'rgba(40, 40, 60, 0.5)';
    
    // Draw the main play area with a border
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const playAreaSize = LEVEL_SIZE * this.scale;
    
    // Draw outer background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw main play area with a slightly different color
    this.ctx.fillStyle = 'rgba(50, 50, 80, 0.4)';
    this.ctx.fillRect(
      centerX - playAreaSize / 2,
      centerY - playAreaSize / 2,
      playAreaSize,
      playAreaSize
    );
    
    // Draw a border around the play area
    this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      centerX - playAreaSize / 2,
      centerY - playAreaSize / 2,
      playAreaSize,
      playAreaSize
    );
  }
  
  /**
   * Draw walls on the minimap
   */
  drawWalls() {
    // Draw walls more prominently
    this.ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
    
    // First separate walls and other objects
    const walls = [];
    const pillars = [];
    
    for (const object of this.gameState.levelObjects) {
      // Skip non-collidable objects and lights
      if (!object || !object.userData || 
          object.userData.type === 'healthPickup' ||
          object.type === 'AmbientLight' ||
          object.type === 'DirectionalLight' ||
          object.type === 'PointLight') continue;
      
      // Get object geometry to determine if it's a floor/ceiling or wall
      if (object.rotation && (object.rotation.x === -Math.PI / 2 || object.rotation.x === Math.PI / 2)) {
        // This is floor or ceiling, don't draw
        continue;
      }
      
      // Determine if it's a wall or pillar based on geometry
      if (object.geometry) {
        if (object.geometry.parameters && 
            object.geometry.parameters.width && 
            object.geometry.parameters.depth) {
          if (Math.min(object.geometry.parameters.width, object.geometry.parameters.depth) <= 2) {
            // This is likely a wall
            walls.push(object);
          } else {
            // This is likely a pillar or block
            pillars.push(object);
          }
        } else {
          walls.push(object);
        }
      } else {
        walls.push(object);
      }
    }
    
    // Draw all walls first
    this.ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
    for (const wall of walls) {
      this.drawObjectOnMinimap(wall);
    }
    
    // Draw pillars with a different color
    this.ctx.fillStyle = 'rgba(180, 180, 220, 0.9)';
    for (const pillar of pillars) {
      this.drawObjectOnMinimap(pillar);
    }
  }
  
  /**
   * Draw an object on the minimap
   */
  drawObjectOnMinimap(object) {
    // Get object bounds
    const box = new THREE.Box3().setFromObject(object);
    
    // Convert to centered minimap coordinates
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const x = centerX + (box.min.x) * this.scale;
    const y = centerY + (box.min.z) * this.scale;
    const width = (box.max.x - box.min.x) * this.scale;
    const height = (box.max.z - box.min.z) * this.scale;
    
    // Draw object with slight border for better visibility
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(x, y, width, height);
  }
  
  /**
   * Draw enemies on the minimap
   */
  drawEnemies() {
    this.ctx.fillStyle = '#ff3333';
    
    for (const enemy of this.gameState.enemies) {
      if (!enemy || !enemy.position) continue;
      
      // Convert to centered minimap coordinates
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      const x = centerX + enemy.position.x * this.scale;
      const y = centerY + enemy.position.z * this.scale;
      
      // Draw enemy with border for better visibility
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 0.8;
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw player on the minimap
   */
  drawPlayer() {
    const playerPosition = this.gameState.camera.position;
    
    // Convert to centered minimap coordinates
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const x = centerX + playerPosition.x * this.scale;
    const y = centerY + playerPosition.z * this.scale;
    
    // Draw player with more visible style
    this.ctx.fillStyle = '#00ff00';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();
    
    // Draw player direction indicator
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.gameState.camera.quaternion);
    
    const angle = Math.atan2(direction.x, direction.z);
    const length = 8;
    
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x + Math.sin(angle) * length,
      y + Math.cos(angle) * length
    );
    this.ctx.stroke();
  }
}
