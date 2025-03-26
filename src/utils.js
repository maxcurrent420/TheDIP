// Utility functions

/**
 * Shows an error message on screen
 * @param {string} message - Error message to display
 */
export function showError(message) {
  const errorMessageElement = document.getElementById('errorMessage');
  errorMessageElement.textContent = message;
  errorMessageElement.style.display = 'block';
  
  // Hide after delay
  setTimeout(() => {
    errorMessageElement.style.display = 'none';
  }, 5000);
  
  // Also log to console
  console.error(message);
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculates distance between two THREE.Vector3 points
 * @param {THREE.Vector3} point1 - First point
 * @param {THREE.Vector3} point2 - Second point
 * @returns {number} Distance between points
 */
export function getDistance(point1, point2) {
  return point1.distanceTo(point2);
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * @param {Function} func - Function to throttle
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Throttled function
 */
export function throttle(func, wait) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Generates a random float between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random color in hexadecimal format
 * @returns {number} Random color as hex number
 */
export function getRandomColor() {
  return Math.random() * 0xffffff;
}
