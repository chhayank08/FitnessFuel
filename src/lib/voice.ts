// Voice coach singleton around window.speechSynthesis.
//
// Mobile constraints this handles:
// - iOS/Android WebViews drop utterances spoken outside a user gesture until
//   the synth has been "unlocked" by speaking once inside one — unlock() must
//   be called from a tap handler before any programmatic speak().
// - Voices load asynchronously; getVoices() is empty until onvoiceschanged.
// - Android Chrome pauses the synth when the tab is backgrounded and sometimes
//   never resumes it; we resume on visibilitychange and poll while speaking.

interface SpeakOptions {
  /** Cancel anything queued/speaking first (rep counts). Default: queue. */
  interrupt?: boolean;
  rate?: number;
}

class VoiceCoach {
  private unlocked = false;
  private voice: SpeechSynthesisVoice | null = null;
  private resumeTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.addEventListener?.('voiceschanged', () => this.pickVoice());
    this.pickVoice();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    });
  }

  private get synth(): SpeechSynthesis | null {
    return typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  }

  private pickVoice() {
    const synth = this.synth;
    if (!synth) return;
    const voices = synth.getVoices();
    if (voices.length === 0) return;
    const lang = navigator.language || 'en-US';
    this.voice =
      voices.find((v) => v.localService && v.lang === lang) ||
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.localService && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
  }

  /** Must be called from inside a user-gesture handler (button tap). */
  unlock() {
    const synth = this.synth;
    if (!synth || this.unlocked) return;
    this.unlocked = true;
    synth.resume();
    const primer = new SpeechSynthesisUtterance('');
    primer.volume = 0;
    synth.speak(primer);
    this.pickVoice();
  }

  speak(text: string, opts: SpeakOptions = {}) {
    const synth = this.synth;
    if (!synth || !text) return;
    if (opts.interrupt) synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = opts.rate ?? 1.05;
    if (this.voice) utter.voice = this.voice;
    utter.onend = () => this.stopResumePolling(synth);
    utter.onerror = () => this.stopResumePolling(synth);
    synth.speak(utter);
    this.startResumePolling(synth);
  }

  /** "Get ready… 3, 2, 1, go!" — fires onDone when the countdown finishes. */
  countdown(onDone: () => void) {
    const synth = this.synth;
    if (!synth) {
      // No TTS available: keep the same pacing so the UI countdown still works.
      setTimeout(onDone, 4000);
      return;
    }
    this.speak('Get ready', { interrupt: true });
    const steps = ['3', '2', '1', 'Go!'];
    steps.forEach((s, i) => {
      setTimeout(() => this.speak(s, { interrupt: true }), 1000 * (i + 1));
    });
    setTimeout(onDone, 1000 * (steps.length + 1) - 500);
  }

  stop() {
    const synth = this.synth;
    if (!synth) return;
    synth.cancel();
    if (this.resumeTimer) {
      clearInterval(this.resumeTimer);
      this.resumeTimer = null;
    }
  }

  // Android Chrome can silently pause mid-utterance (long text or after
  // background/foreground); poll while anything is pending and kick resume.
  private startResumePolling(synth: SpeechSynthesis) {
    if (this.resumeTimer) return;
    this.resumeTimer = setInterval(() => {
      if (!synth.speaking && !synth.pending) {
        this.stopResumePolling(synth);
        return;
      }
      if (synth.paused) synth.resume();
    }, 5000);
  }

  private stopResumePolling(synth: SpeechSynthesis) {
    if (!this.resumeTimer) return;
    if (synth.speaking || synth.pending) return;
    clearInterval(this.resumeTimer);
    this.resumeTimer = null;
  }
}

export const voice = new VoiceCoach();
