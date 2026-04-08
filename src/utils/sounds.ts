/**
 * Sound effects manager
 * Handles loading and playing game sounds
 */

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds();
    // Load sound preference from localStorage
    const savedPreference = localStorage.getItem('soundEnabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
    }
  }

  private loadSounds() {
    // Preload sound files
    this.sounds.set('walk', new Audio('/walk.mp3'));
    this.sounds.set('win', new Audio('/win.mp3'));

    // Set volume
    this.sounds.forEach(sound => {
      sound.volume = 0.5;
    });
  }

  play(soundName: 'walk' | 'win') {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      // Clone and play to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = sound.volume;
      clone.play().catch(err => {
        console.warn('Failed to play sound:', err);
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = clampedVolume;
    });
  }
}

// Singleton instance
export const soundManager = new SoundManager();
