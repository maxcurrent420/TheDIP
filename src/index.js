// Entry point for the game
import { Game } from './game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the game
  const game = new Game();
  game.initGame().catch(error => {
    console.error('Failed to initialize game:', error);
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = 'Failed to initialize game: ' + error.message;
      errorElement.style.display = 'block';
    }
  });
  
  // Expose game to window for debugging
  window.game = game;
});
