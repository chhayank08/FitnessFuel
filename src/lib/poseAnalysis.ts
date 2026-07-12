// Pure pose-analysis math: joint angles, rep-phase state machines, and form
// scoring from MediaPipe PoseLandmarker output. No DOM/camera code here —
// keeps this testable and reusable independent of the live session UI.

export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// MediaPipe Pose landmark indices (33-point model)
export const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

// Angle at point `b` formed by rays b→a and b→c, in degrees [0, 180].
export function angleDeg(a: Point3D, b: Point3D, c: Point3D): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export type RepPhase = 'idle' | 'active' | 'bottom' | 'returning';

export interface RepResult {
  score: number; // 0-100
  cue: string | null;
  romDeg: number;
}

export interface ExerciseConfig {
  key: string;
  name: string;
  // returns the primary joint angle driving the rep phase (e.g. knee angle for squats)
  primaryAngle: (lm: Point3D[]) => number | null;
  // phase thresholds: angle above `topThreshold` = idle/standing, below `bottomThreshold` = bottom of rep
  topThreshold: number;
  bottomThreshold: number;
  // called once a rep completes (idle -> bottom -> idle), returns score + coaching cue
  scoreRep: (minAngle: number, lm: Point3D[]) => RepResult;
  instructions: string;
  // when true the working angle RISES into the rep (e.g. jumping jacks); the
  // counter tracks the mirrored angle (180 - raw) so thresholds keep the same
  // "smaller = deeper" semantics
  invert?: boolean;
  // minimum ms between counted reps — debounces fast-cadence exercises
  minRepMs?: number;
}

// Timed posture-hold exercises (plank, wall sit): no reps, just a per-frame
// posture check accumulated into an ok-time ratio.
export interface HoldCheck {
  ok: boolean;
  cue: string | null;
}

export interface HoldExerciseConfig {
  key: string;
  name: string;
  instructions: string;
  checkPosture: (lm: Point3D[]) => HoldCheck | null; // null = landmarks not visible enough
}

function avgVisible(lm: Point3D[], ...indices: number[]): Point3D | null {
  const pts = indices.map((i) => lm[i]).filter((p) => p && (p.visibility ?? 1) > 0.4);
  if (pts.length === 0) return null;
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    z: 0,
  };
}

function kneeAngle(lm: Point3D[], side: 'LEFT' | 'RIGHT'): number | null {
  const hip = lm[LANDMARK[`${side}_HIP`]];
  const knee = lm[LANDMARK[`${side}_KNEE`]];
  const ankle = lm[LANDMARK[`${side}_ANKLE`]];
  if (!hip || !knee || !ankle) return null;
  if ((hip.visibility ?? 1) < 0.4 || (knee.visibility ?? 1) < 0.4 || (ankle.visibility ?? 1) < 0.4) return null;
  return angleDeg(hip, knee, ankle);
}

function elbowAngle(lm: Point3D[], side: 'LEFT' | 'RIGHT'): number | null {
  const shoulder = lm[LANDMARK[`${side}_SHOULDER`]];
  const elbow = lm[LANDMARK[`${side}_ELBOW`]];
  const wrist = lm[LANDMARK[`${side}_WRIST`]];
  if (!shoulder || !elbow || !wrist) return null;
  if ((shoulder.visibility ?? 1) < 0.4 || (elbow.visibility ?? 1) < 0.4 || (wrist.visibility ?? 1) < 0.4) return null;
  return angleDeg(shoulder, elbow, wrist);
}

// Torso/hip flexion angle at the hip: shoulder–hip–knee.
function hipAngle(lm: Point3D[], side: 'LEFT' | 'RIGHT'): number | null {
  const shoulder = lm[LANDMARK[`${side}_SHOULDER`]];
  const hip = lm[LANDMARK[`${side}_HIP`]];
  const knee = lm[LANDMARK[`${side}_KNEE`]];
  if (!shoulder || !hip || !knee) return null;
  if ((shoulder.visibility ?? 1) < 0.4 || (hip.visibility ?? 1) < 0.4 || (knee.visibility ?? 1) < 0.4) return null;
  return angleDeg(shoulder, hip, knee);
}

// Arm elevation at the shoulder: hip–shoulder–wrist (jumping jacks).
function shoulderAbductionAngle(lm: Point3D[], side: 'LEFT' | 'RIGHT'): number | null {
  const hip = lm[LANDMARK[`${side}_HIP`]];
  const shoulder = lm[LANDMARK[`${side}_SHOULDER`]];
  const wrist = lm[LANDMARK[`${side}_WRIST`]];
  if (!hip || !shoulder || !wrist) return null;
  if ((hip.visibility ?? 1) < 0.4 || (shoulder.visibility ?? 1) < 0.4 || (wrist.visibility ?? 1) < 0.4) return null;
  return angleDeg(hip, shoulder, wrist);
}

function minSide(l: number | null, r: number | null): number | null {
  if (l == null && r == null) return null;
  return Math.min(l ?? 180, r ?? 180);
}

function maxSide(l: number | null, r: number | null): number | null {
  if (l == null && r == null) return null;
  return Math.max(l ?? 0, r ?? 0);
}

export const EXERCISES: Record<string, ExerciseConfig> = {
  squat: {
    key: 'squat',
    name: 'Squat',
    instructions: 'Stand facing the camera, feet shoulder-width apart, so your hips, knees, and ankles are all visible.',
    primaryAngle: (lm) => {
      const l = kneeAngle(lm, 'LEFT');
      const r = kneeAngle(lm, 'RIGHT');
      if (l == null && r == null) return null;
      return Math.min(l ?? 180, r ?? 180);
    },
    topThreshold: 160,
    bottomThreshold: 110,
    scoreRep: (minAngle) => {
      // full depth ~90°, shallow >120°
      const depthScore = minAngle <= 95 ? 100 : minAngle <= 110 ? 80 : minAngle <= 130 ? 55 : 30;
      const cue = minAngle > 110 ? 'Try to squat a bit deeper next rep' : minAngle < 70 ? 'Great depth — control the descent' : null;
      return { score: depthScore, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  pushup: {
    key: 'pushup',
    name: 'Push-up',
    instructions: 'Position your camera to the side so your shoulders, elbows, wrists, hips, and ankles are all visible.',
    primaryAngle: (lm) => {
      const l = elbowAngle(lm, 'LEFT');
      const r = elbowAngle(lm, 'RIGHT');
      if (l == null && r == null) return null;
      return Math.min(l ?? 180, r ?? 180);
    },
    topThreshold: 155,
    bottomThreshold: 100,
    scoreRep: (minAngle, lm) => {
      const depthScore = minAngle <= 90 ? 100 : minAngle <= 105 ? 80 : minAngle <= 130 ? 55 : 30;
      // body-line straightness: shoulder-hip-ankle should be close to 180°
      const shoulder = avgVisible(lm, LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER);
      const hip = avgVisible(lm, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP);
      const ankle = avgVisible(lm, LANDMARK.LEFT_ANKLE, LANDMARK.RIGHT_ANKLE);
      let lineScore = 100;
      let cue: string | null = null;
      if (shoulder && hip && ankle) {
        const lineAngle = angleDeg(shoulder, hip, ankle);
        lineScore = lineAngle >= 165 ? 100 : lineAngle >= 150 ? 75 : 45;
        if (lineAngle < 150) cue = 'Keep your hips level — avoid sagging or piking';
      }
      const score = Math.round(depthScore * 0.6 + lineScore * 0.4);
      if (!cue) cue = minAngle > 105 ? 'Lower your chest closer to the floor' : null;
      return { score, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  'bicep-curl': {
    key: 'bicep-curl',
    name: 'Bicep Curl',
    instructions: 'Face the camera with your working arm visible from shoulder to wrist.',
    primaryAngle: (lm) => {
      const l = elbowAngle(lm, 'LEFT');
      const r = elbowAngle(lm, 'RIGHT');
      if (l == null && r == null) return null;
      // curls track whichever arm is moving most (further from resting ~170°)
      if (l == null) return r;
      if (r == null) return l;
      return Math.abs(180 - l) > Math.abs(180 - r) ? l : r;
    },
    topThreshold: 155,
    bottomThreshold: 60,
    scoreRep: (minAngle, lm) => {
      const romScore = minAngle <= 45 ? 100 : minAngle <= 60 ? 85 : minAngle <= 80 ? 60 : 35;
      // elbow-travel lock: shoulder shouldn't drift forward/up during the curl
      const shoulder = avgVisible(lm, LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER);
      const hip = avgVisible(lm, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP);
      let postureScore = 100;
      let cue: string | null = null;
      if (shoulder && hip) {
        const torsoLean = Math.abs(shoulder.x - hip.x);
        postureScore = torsoLean < 0.05 ? 100 : torsoLean < 0.1 ? 70 : 40;
        if (torsoLean >= 0.1) cue = 'Keep your torso still — avoid swinging to lift the weight';
      }
      const score = Math.round(romScore * 0.7 + postureScore * 0.3);
      if (!cue) cue = minAngle > 70 ? 'Curl through a fuller range of motion' : null;
      return { score, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  lunge: {
    key: 'lunge',
    name: 'Lunge',
    instructions: 'Stand side-on or facing the camera so your hips, knees, and ankles stay visible through the stride.',
    primaryAngle: (lm) => minSide(kneeAngle(lm, 'LEFT'), kneeAngle(lm, 'RIGHT')),
    topThreshold: 160,
    bottomThreshold: 110,
    scoreRep: (minAngle) => {
      const depthScore = minAngle <= 95 ? 100 : minAngle <= 110 ? 80 : minAngle <= 130 ? 55 : 30;
      const cue = minAngle > 110 ? 'Sink lower — both knees toward 90 degrees' : null;
      return { score: depthScore, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  'jumping-jack': {
    key: 'jumping-jack',
    name: 'Jumping Jack',
    instructions: 'Face the camera with your full body in frame, arms visible from shoulders to wrists.',
    // arm elevation rises into the rep — inverted so thresholds keep "smaller = rep bottom"
    primaryAngle: (lm) => maxSide(shoulderAbductionAngle(lm, 'LEFT'), shoulderAbductionAngle(lm, 'RIGHT')),
    invert: true,
    topThreshold: 140, // arms down: effective angle ~160
    bottomThreshold: 60, // arms overhead: effective angle ~30
    minRepMs: 400,
    scoreRep: (minEffective) => {
      const score = minEffective <= 40 ? 100 : minEffective <= 60 ? 80 : 55;
      const cue = minEffective > 45 ? 'Reach your arms all the way overhead' : null;
      return { score, cue, romDeg: Math.round(180 - minEffective) };
    },
  },
  situp: {
    key: 'situp',
    name: 'Sit-up',
    instructions: 'Place your phone to the side at floor level so your torso, hips, and knees are visible.',
    primaryAngle: (lm) => minSide(hipAngle(lm, 'LEFT'), hipAngle(lm, 'RIGHT')),
    topThreshold: 130,
    bottomThreshold: 85,
    scoreRep: (minAngle) => {
      const score = minAngle <= 65 ? 100 : minAngle <= 85 ? 80 : 55;
      const cue = minAngle > 85 ? 'Come all the way up toward your knees' : null;
      return { score, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  crunch: {
    key: 'crunch',
    name: 'Crunch',
    instructions: 'Place your phone to the side at floor level so your shoulders, hips, and knees are visible.',
    primaryAngle: (lm) => minSide(hipAngle(lm, 'LEFT'), hipAngle(lm, 'RIGHT')),
    topThreshold: 145,
    bottomThreshold: 125,
    minRepMs: 600,
    scoreRep: (minAngle) => {
      const score = minAngle <= 115 ? 100 : minAngle <= 125 ? 80 : 55;
      const cue = minAngle > 125 ? 'Curl your shoulder blades a little higher' : null;
      return { score, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  'high-knees': {
    key: 'high-knees',
    name: 'High Knees',
    instructions: 'Face the camera with your full body in frame. Each knee drive counts as a rep.',
    primaryAngle: (lm) => minSide(hipAngle(lm, 'LEFT'), hipAngle(lm, 'RIGHT')),
    topThreshold: 150,
    bottomThreshold: 110,
    minRepMs: 250,
    scoreRep: (minAngle) => {
      const score = minAngle <= 95 ? 100 : minAngle <= 110 ? 85 : 60;
      const cue = minAngle > 110 ? 'Drive your knees up to hip height' : null;
      return { score, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
  'glute-bridge': {
    key: 'glute-bridge',
    name: 'Glute Bridge',
    instructions: 'Place your phone to the side at floor level so your shoulders, hips, and knees are visible while lying down.',
    // hip extension rises into the rep (flat ~130° → bridged ~175°) — inverted
    primaryAngle: (lm) => maxSide(hipAngle(lm, 'LEFT'), hipAngle(lm, 'RIGHT')),
    invert: true,
    topThreshold: 42, // lying flat: effective ~50
    bottomThreshold: 18, // full bridge: effective ~5-15
    minRepMs: 600,
    scoreRep: (minEffective) => {
      const score = minEffective <= 10 ? 100 : minEffective <= 18 ? 85 : 60;
      const cue = minEffective > 18 ? 'Squeeze your glutes and lift your hips higher' : null;
      return { score, cue, romDeg: Math.round(50 - minEffective) };
    },
  },
  'mountain-climber': {
    key: 'mountain-climber',
    name: 'Mountain Climber',
    instructions: 'Place your phone to the side so your plank line and knee drives are visible. Each knee drive counts.',
    primaryAngle: (lm) => minSide(hipAngle(lm, 'LEFT'), hipAngle(lm, 'RIGHT')),
    topThreshold: 150,
    bottomThreshold: 100,
    minRepMs: 250,
    scoreRep: (minAngle) => {
      const score = minAngle <= 85 ? 100 : minAngle <= 100 ? 85 : 60;
      const cue = minAngle > 100 ? 'Drive your knee closer to your chest' : null;
      return { score, cue, romDeg: Math.round(180 - minAngle) };
    },
  },
};

export type ExerciseKey = keyof typeof EXERCISES;

// ── Posture-hold exercises ──────────────────────────────────────────────────

export const HOLD_EXERCISES: Record<string, HoldExerciseConfig> = {
  plank: {
    key: 'plank',
    name: 'Plank',
    instructions: 'Place your phone to the side at floor level so your shoulders, hips, and ankles are all visible.',
    checkPosture: (lm) => {
      const shoulder = avgVisible(lm, LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER);
      const hip = avgVisible(lm, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP);
      const ankle = avgVisible(lm, LANDMARK.LEFT_ANKLE, LANDMARK.RIGHT_ANKLE);
      if (!shoulder || !hip || !ankle) return null;
      const line = angleDeg(shoulder, hip, ankle);
      if (line >= 155) return { ok: true, cue: null };
      // hip below the shoulder→ankle midline (bigger y = lower on screen) = sagging
      const midY = (shoulder.y + ankle.y) / 2;
      return hip.y > midY
        ? { ok: false, cue: 'Lift your hips — keep one straight line' }
        : { ok: false, cue: 'Lower your hips — avoid piking up' };
    },
  },
  'wall-sit': {
    key: 'wall-sit',
    name: 'Wall Sit',
    instructions: 'Place your phone to the side so your hips, knees, and ankles are visible against the wall.',
    checkPosture: (lm) => {
      const knee = minSide(kneeAngle(lm, 'LEFT'), kneeAngle(lm, 'RIGHT'));
      if (knee == null) return null;
      if (knee >= 75 && knee <= 115) return { ok: true, cue: null };
      return knee > 115
        ? { ok: false, cue: 'Slide down until your knees reach 90 degrees' }
        : { ok: false, cue: 'Rise up slightly — knees at 90 degrees' };
    },
  },
};

export type HoldExerciseKey = keyof typeof HOLD_EXERCISES;

// Rep-phase state machine: tracks the primary angle across frames and fires
// onRepComplete once a full idle→bottom→idle cycle finishes.
export class RepCounter {
  private phase: RepPhase = 'idle';
  private minAngleThisRep = 180;
  private lastRepAt = 0;
  private config: ExerciseConfig;

  constructor(config: ExerciseConfig) {
    this.config = config;
  }

  // Feed one frame's landmarks; returns a completed RepResult or null.
  process(landmarks: Point3D[]): RepResult | null {
    const raw = this.config.primaryAngle(landmarks);
    if (raw == null) return null;
    const angle = this.config.invert ? 180 - raw : raw;

    if (this.phase === 'idle' && angle < this.config.topThreshold) {
      this.phase = 'active';
      this.minAngleThisRep = angle;
    } else if (this.phase === 'active') {
      this.minAngleThisRep = Math.min(this.minAngleThisRep, angle);
      if (angle < this.config.bottomThreshold) this.phase = 'bottom';
    } else if (this.phase === 'bottom') {
      this.minAngleThisRep = Math.min(this.minAngleThisRep, angle);
      if (angle > this.config.topThreshold) {
        this.phase = 'idle';
        const minAngle = this.minAngleThisRep;
        this.minAngleThisRep = 180;
        const now = Date.now();
        if (this.config.minRepMs && now - this.lastRepAt < this.config.minRepMs) return null;
        this.lastRepAt = now;
        return this.config.scoreRep(minAngle, landmarks);
      }
    }
    return null;
  }

  getPhase(): RepPhase {
    return this.phase;
  }
}

// Accumulates posture quality over a timed hold. Score = % of tracked frames
// with acceptable posture; cues change only when the correction changes so
// the voice coach doesn't spam.
export class HoldTracker {
  private okFrames = 0;
  private totalFrames = 0;
  private lastCue: string | null = null;
  private config: HoldExerciseConfig;

  constructor(config: HoldExerciseConfig) {
    this.config = config;
  }

  // Feed one frame; returns a cue string only when the correction CHANGES.
  process(landmarks: Point3D[]): string | null {
    const check = this.config.checkPosture(landmarks);
    if (!check) return null;
    this.totalFrames += 1;
    if (check.ok) this.okFrames += 1;
    if (check.cue !== this.lastCue) {
      this.lastCue = check.cue;
      return check.cue;
    }
    return null;
  }

  getScore(): number {
    if (this.totalFrames === 0) return 0;
    return Math.round((this.okFrames / this.totalFrames) * 100);
  }

  getCurrentCue(): string | null {
    return this.lastCue;
  }
}
