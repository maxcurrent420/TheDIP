// Audio manager module
/**
 * AudioManager class to handle all game sound effects using THREE.js Audio
 */
export class AudioManager {
  constructor() {
    // Audio context
    this.audioContext = null;
    this.listener = null;
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.muted = false;
    this.THREE = null;
    this.audioLoader = null;
    
    // Ensure iOS/Safari compatibility by initializing on user interaction
    this.initialized = false;
    
    // Bind methods
    this.initAudio = this.initAudio.bind(this);
    this.loadSound = this.loadSound.bind(this);
    this.playSound = this.playSound.bind(this);
    this.playMusic = this.playMusic.bind(this);
    this.stopMusic = this.stopMusic.bind(this);
    this.setMusicVolume = this.setMusicVolume.bind(this);
    this.setSfxVolume = this.setSfxVolume.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
  }
  
  /**
   * Initialize the audio system
   * Must be called on a user interaction
   */
  async initAudio() {
    if (this.initialized) {
      console.log('Audio already initialized, returning existing setup');
      return Promise.resolve();
    }
    
    try {
      // Import THREE dynamically for the listener
      this.THREE = await import('three');
      
      // Create a Web Audio AudioContext for more direct control
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      
      // Create a single audio context for the entire game
      this.audioContext = new AudioContext();
      console.log('Created new AudioContext:', this.audioContext.state);
      
      // Create THREE AudioListener and associate it with our audio context
      this.listener = new this.THREE.AudioListener();
      
      // This is critical - ensure the listener uses our audio context
      this.listener.context = this.audioContext;
      console.log('Audio listener created and linked to our context');
      
      // Create AudioLoader
      this.audioLoader = new this.THREE.AudioLoader();
      console.log('Audio loader created');
      
      // Force resume audio context to ensure it's active
      if (this.audioContext.state !== 'running') {
        try {
          await this.audioContext.resume();
          console.log('Audio context resumed successfully');
        } catch (resumeError) {
          console.warn('Failed to resume audio context:', resumeError);
          // Continue anyway as user interaction may resume it later
        }
      }
      
      // Correct audio path - no leading slash, just use relative path
      const audioPath = 'audio/';
      console.log('Audio path:', audioPath);
      
      // Load all sounds
      const soundPromises = [
        this.loadSound('shoot_bullet', `${audioPath}shoot_bullet.mp3`),
        this.loadSound('shoot_fireball', `${audioPath}shoot_fireball.mp3`),
        this.loadSound('shoot_ice', `${audioPath}shoot_ice.mp3`),
        this.loadSound('shoot_sonic', `${audioPath}shoot_sonic.mp3`),
        this.loadSound('shoot_shield', `${audioPath}shoot_shield.mp3`),
        this.loadSound('shoot_teleport', `${audioPath}shoot_teleport.mp3`),
        this.loadSound('player_damage', `${audioPath}player_damage.mp3`),
        this.loadSound('player_death', `${audioPath}player_death.mp3`),
        this.loadSound('enemy_damage', `${audioPath}enemy_damage.mp3`),
        this.loadSound('enemy_death', `${audioPath}enemy_death.mp3`),
        this.loadSound('dimension_shift', `${audioPath}dimension_shift.mp3`),
        this.loadSound('power_absorb', `${audioPath}power_absorb.mp3`),
        this.loadSound('pickup_health', `${audioPath}pickup_health.mp3`),
        this.loadSound('level_complete', `${audioPath}level_complete.mp3`),
        this.loadSound('powerstone_activate', `${audioPath}powerstone_activate.mp3`),
        this.loadSound('menu_select', `${audioPath}menu_select.mp3`),
        this.loadSound('menu_click', `${audioPath}menu_click.mp3`)
      ];
      
      try {
        const loadedSounds = await Promise.all(soundPromises);
        console.log('All sounds loaded successfully:', loadedSounds.length);
      } catch (soundError) {
        console.warn('Some sounds failed to load, but continuing:', soundError);
      }
      
      // Mark as initialized before returning
      this.initialized = true;
      
      // Add event listeners for audio context state changes
      this.audioContext.addEventListener('statechange', () => {
        console.log('Audio context state changed to:', this.audioContext.state);
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Get the listener object
   * @returns {THREE.AudioListener} Audio listener
   */
  getListener() {
    return this.listener;
  }
  
  /**
   * Load a sound file using Web Audio API directly
   * @param {string} id - Sound identifier
   * @param {string} url - Sound file URL
   * @returns {Promise} - Loading promise
   */
  loadSound(id, url) {
    return new Promise((resolve, reject) => {
      if (!this.audioContext) {
        console.error('Audio context not initialized');
        reject(new Error('Audio context not initialized'));
        return;
      }
      
      console.log(`Attempting to load sound: ${id} from ${url}`);
      
      // Use fetch to get audio file as ArrayBuffer, which works better for our direct Web Audio approach
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => {
          // Decode the audio data using our audioContext
          return this.audioContext.decodeAudioData(arrayBuffer);
        })
        .then(audioBuffer => {
          // Store the decoded buffer directly
          console.log(`Successfully loaded sound: ${id}, duration: ${audioBuffer.duration}s`);
          this.sounds[id] = {
            buffer: audioBuffer,
            isPlaying: false
          };
          resolve(this.sounds[id]);
        })
        .catch(error => {
          console.error(`Failed to load sound ${id}:`, error);
          this.sounds[id] = {
            buffer: null,
            loadFailed: true,
            error: error.message
          };
          reject(error);
        });
    });
  }
  
  /**
   * Play a sound effect
   * @param {string} id - Sound identifier
   * @param {Object} options - Playback options
   * @returns {THREE.Audio|null} - Audio object or null if sound not found
   */
  playSound(id, options = {}) {
    if (!this.initialized || this.muted) {
      console.warn(`Can't play sound ${id}: Audio is not initialized or muted`);
      return null;
    }
    
    const sound = this.sounds[id];
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return null;
    }
    
    // Skip sounds that failed to load
    if (sound.loadFailed) {
      console.warn(`Skipping failed sound: ${id}, error: ${sound.error}`);
      return null;
    }
    
    if (!sound.buffer) {
      console.warn(`Sound ${id} has no buffer`);
      return null;
    }
    
    try {
      // Create a direct Web Audio API approach instead of using THREE.Audio
      // This avoids the audio context connection issues
      if (!this.audioContext) {
        console.warn(`Cannot play sound ${id}: Missing audio context`);
        return null;
      }
      
      // Create audio source directly with the Web Audio API
      const source = this.audioContext.createBufferSource();
      source.buffer = sound.buffer;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const volume = options.volume !== undefined ? options.volume * this.sfxVolume : this.sfxVolume;
      gainNode.gain.value = volume;
      
      // Connect source to gain node and gain node to destination
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set loop and playback rate
      source.loop = options.loop || false;
      if (options.playbackRate) {
        source.playbackRate.value = options.playbackRate;
      }
      
      // Start playback
      source.start(0);
      console.log(`Playing sound: ${id}`);
      
      // Store the source for potential reference
      sound.source = source;
      sound.isPlaying = true;
      
      // When sound ends, update isPlaying
      source.onended = () => {
        sound.isPlaying = false;
        sound.source = null;
      };
      
      return source;
    } catch (error) {
      console.error(`Error playing sound ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Play background music
   * @param {string} url - Music file URL
   */
  playMusic(url) {
    if (!this.initialized || this.muted || !this.audioContext) return;
    
    // Stop current music if playing
    this.stopMusic();
    
    // Use fetch to get the music file
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        // Decode the audio data
        return this.audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        // Create source and gain nodes
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.musicVolume;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set properties
        source.loop = true;
        
        // Start playback
        source.start(0);
        
        // Store reference
        this.music = {
          source: source,
          gainNode: gainNode,
          isPlaying: true
        };
      })
      .catch(error => {
        console.error('Error loading music:', error);
      });
  }
  
  /**
   * Stop background music
   */
  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.source.stop();
      this.music.isPlaying = false;
    }
  }
  
  /**
   * Set music volume
   * @param {number} volume - Volume (0 to 1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.music && this.music.gainNode) {
      this.music.gainNode.gain.value = this.musicVolume;
    }
  }
  
  /**
   * Set sound effects volume
   * @param {number} volume - Volume (0 to 1)
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Toggle mute state
   * @returns {boolean} - New mute state
   */
  toggleMute() {
    this.muted = !this.muted;
    
    // Update music based on mute state
    if (this.music && this.music.gainNode) {
      this.music.gainNode.gain.value = this.muted ? 0 : this.musicVolume;
    }
    
    return this.muted;
  }
}

// Helper functions
/**
 * Play different shoot sound based on power type
 * @param {AudioManager} audioManager - Audio manager instance
 * @param {string} powerType - Type of power
 */
export function playShootSound(audioManager, powerType) {
  if (!audioManager || !audioManager.initialized) {
    console.warn('Cannot play shoot sound: Audio manager not initialized');
    return;
  }
  
  let soundId = 'shoot_bullet'; // Default sound
  
  // Determine which sound to play based on power type
  switch (powerType) {
    case 'fireball':
      soundId = 'shoot_fireball';
      break;
    case 'ice':
      soundId = 'shoot_ice';
      break;
    case 'sonic':
      soundId = 'shoot_sonic';
      break;
    case 'shield':
      soundId = 'shoot_shield';
      break;
    case 'teleport':
      soundId = 'shoot_teleport';
      break;
  }
  
  try {
    // Use try-catch to prevent errors from breaking game flow
    audioManager.playSound(soundId);
    console.log(`Playing ${soundId} sound for ${powerType} power`);
  } catch (error) {
    console.warn(`Failed to play ${soundId} sound:`, error);
  }
}
