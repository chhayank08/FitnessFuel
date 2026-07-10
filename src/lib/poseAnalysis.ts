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
};

export type ExerciseKey = keyof typeof EXERCISES;

// Rep-phase state machine: tracks the primary angle across frames and fires
// onRepComplete once a full idle→bottom→idle cycle finishes.
export class RepCounter {
  private phase: RepPhase = 'idle';
  private minAngleThisRep = 180;
  private config: ExerciseConfig;

  constructor(config: ExerciseConfig) {
    this.config = config;
  }

  // Feed one frame's landmarks; returns a completed RepResult or null.
  process(landmarks: Point3D[]): RepResult | null {
    const angle = this.config.primaryAngle(landmarks);
    if (angle == null) return null;

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
        const result = this.config.scoreRep(this.minAngleThisRep, landmarks);
        this.minAngleThisRep = 180;
        return result;
      }
    }
    return null;
  }

  getPhase(): RepPhase {
    return this.phase;
  }
}
