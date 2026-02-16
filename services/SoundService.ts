
export class SoundService {
  private static audioCtx: AudioContext | null = null;
  private static keepAliveOsc: OscillatorNode | null = null;

  /**
   * Initializes the AudioContext on user interaction.
   * Browsers require an explicit user gesture to enable audio.
   */
  static async unlock() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    
    this.startKeepAlive();
  }

  /**
   * Keeps the audio context active by playing a silent loop.
   * Prevents the mobile browser from suspending the audio context when the tab is in the background.
   */
  private static startKeepAlive() {
    if (!this.audioCtx || this.keepAliveOsc) return;
    
    const silentGain = this.audioCtx.createGain();
    silentGain.gain.value = 0.001; // Inaudible
    silentGain.connect(this.audioCtx.destination);
    
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1; // 1Hz
    osc.connect(silentGain);
    osc.start();
    this.keepAliveOsc = osc;
  }

  static stopKeepAlive() {
    if (this.keepAliveOsc) {
      this.keepAliveOsc.stop();
      this.keepAliveOsc = null;
    }
  }

  /**
   * Plays high-pitched, continuous, clear beeps with reduced volume.
   * Uses a 'triangle' wave for clarity.
   * Frequency: 880Hz (A5) for high pitch.
   * Volume: 0.3 (Reduced as per user request).
   */
  static async play(soundId: string = 'zen-bell', repeats: number = 3): Promise<void> {
    if (!this.audioCtx) {
      await this.unlock();
    }
    
    const ctx = this.audioCtx!;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const beepDuration = 0.15; // 150ms per beep segment
    const totalDuration = repeats * beepDuration;
    const frequency = 880; // High-pitched (A5)
    const maxVolume = 0.3; // Reduced volume as requested

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    // Initial silent start
    gain.gain.setValueAtTime(0, now);

    // Schedule the pulsing envelope
    for (let i = 0; i < repeats; i++) {
      const startTime = now + (i * beepDuration);
      const peakTime = startTime + 0.01;
      const dipTime = startTime + beepDuration - 0.01;
      
      // Fast ramp up
      gain.gain.exponentialRampToValueAtTime(maxVolume, peakTime);
      
      // Keep volume high
      gain.gain.setValueAtTime(maxVolume, dipTime);
      
      // Dip to a lower volume very fast to create a 'pulse' without total silence
      if (i < repeats - 1) {
        gain.gain.exponentialRampToValueAtTime(0.05, startTime + beepDuration);
      } else {
        // Final beep ramps to silence
        gain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);
      }
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + totalDuration + 0.1); 
    
    // Cleanup nodes
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    return new Promise(resolve => setTimeout(resolve, (totalDuration + 0.1) * 1000));
  }
}
