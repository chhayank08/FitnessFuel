// Local exercise catalog: the single source of truth for every exercise the
// workout player, quick-workout picker, and plan generator can schedule.
// Demo media is resolved separately (services/exerciseMedia.ts) by fuzzy name
// match against the remote library, so entries here stay network-free.
//
// `tracking` decides the player mode:
//   camera-reps  → pose rep counting (needs poseKey in poseAnalysis EXERCISES)
//   camera-hold  → pose posture hold (needs poseKey)
//   timer        → guided countdown, no camera
// Flipping any entry to 'timer' is always safe — no other code changes needed.

export type ExerciseCategory = 'strength' | 'core' | 'cardio' | 'yoga' | 'stretching';
export type ExerciseTracking = 'camera-reps' | 'camera-hold' | 'timer';

export interface CatalogExercise {
  key: string;
  name: string;
  category: ExerciseCategory;
  type: 'reps' | 'timed';
  defaultSets: number;
  defaultReps?: number;
  defaultDurationSec?: number;
  restSec: number;
  /** Compendium of Physical Activities MET value. */
  met: number;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  description: string;
  instructions: string[];
  commonMistakes: string[];
  safetyTips: string[];
  modifications: string[];
  tracking: ExerciseTracking;
  poseKey?: string;
  /** Name used to fuzzy-match demo media in the remote exercise library. */
  mediaQuery: string;
  /** Shown in the Quick Workout picker. */
  quickPick?: boolean;
}

interface ExerciseSpec {
  key: string;
  name: string;
  category: ExerciseCategory;
  met: number;
  primary: string[];
  secondary?: string[];
  difficulty?: CatalogExercise['difficulty'];
  equipment?: string;
  description: string;
  instructions: string[];
  mistakes: string[];
  safety?: string[];
  modifications?: string[];
  // reps-based unless durationSec given
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSec?: number;
  tracking?: ExerciseTracking;
  poseKey?: string;
  mediaQuery?: string;
  quickPick?: boolean;
}

function ex(spec: ExerciseSpec): CatalogExercise {
  const timed = spec.durationSec != null;
  return {
    key: spec.key,
    name: spec.name,
    category: spec.category,
    type: timed ? 'timed' : 'reps',
    defaultSets: spec.sets ?? (timed ? 1 : 3),
    defaultReps: timed ? undefined : spec.reps ?? 12,
    defaultDurationSec: spec.durationSec,
    restSec: spec.restSec ?? (timed ? 20 : 45),
    met: spec.met,
    primaryMuscles: spec.primary,
    secondaryMuscles: spec.secondary ?? [],
    difficulty: spec.difficulty ?? 'beginner',
    equipment: spec.equipment ?? 'none',
    description: spec.description,
    instructions: spec.instructions,
    commonMistakes: spec.mistakes,
    safetyTips: spec.safety ?? ['Stop if you feel sharp pain.', 'Keep breathing steadily throughout.'],
    modifications: spec.modifications ?? [],
    tracking: spec.tracking ?? 'timer',
    poseKey: spec.poseKey,
    mediaQuery: spec.mediaQuery ?? spec.name.toLowerCase(),
    quickPick: spec.quickPick,
  };
}

const LIST: CatalogExercise[] = [
  // ───────────────────────────── Strength (home) ─────────────────────────────
  ex({
    key: 'pushup', name: 'Push-ups', category: 'strength', met: 8.0,
    primary: ['Chest', 'Triceps'], secondary: ['Shoulders', 'Core'], difficulty: 'intermediate',
    description: 'The classic upper-body press: lower your chest to the floor and push back up with a rigid body line.',
    instructions: ['Place hands slightly wider than shoulders, body in a straight line.', 'Lower your chest until your elbows reach ~90°.', 'Push through your palms back to the start, exhaling on the way up.'],
    mistakes: ['Sagging or piking hips', 'Flaring elbows out to 90°', 'Cutting the range of motion short'],
    modifications: ['Easier: knee or incline push-ups.', 'Harder: diamond or decline push-ups.'],
    reps: 12, tracking: 'camera-reps', poseKey: 'pushup', mediaQuery: 'push-up', quickPick: true,
  }),
  ex({
    key: 'knee-pushup', name: 'Knee Push-ups', category: 'strength', met: 3.8,
    primary: ['Chest', 'Triceps'], secondary: ['Shoulders', 'Core'],
    description: 'A push-up regression from the knees that keeps perfect pressing mechanics while reducing load.',
    instructions: ['Kneel and walk your hands forward until your body forms a straight line from knees to head.', 'Lower your chest between your hands.', 'Press back up without letting the hips break the line.'],
    mistakes: ['Hips bending at the crease', 'Hands too far forward'],
    modifications: ['Harder: switch to full push-ups.'],
    reps: 12, tracking: 'camera-reps', poseKey: 'pushup', mediaQuery: 'push-up',
  }),
  ex({
    key: 'incline-pushup', name: 'Incline Push-ups', category: 'strength', met: 5.0,
    primary: ['Chest', 'Triceps'], secondary: ['Shoulders', 'Core'],
    description: 'Push-ups with hands elevated on a bench or wall — a smooth strength ramp toward the floor version.',
    instructions: ['Place hands on a stable elevated surface, body straight.', 'Lower your chest to the edge.', 'Press back to a full lockout.'],
    mistakes: ['Standing too upright to make it trivial', 'Dropping the hips'],
    modifications: ['Easier: higher surface.', 'Harder: lower surface, then the floor.'],
    reps: 12, tracking: 'camera-reps', poseKey: 'pushup', mediaQuery: 'incline push-up',
  }),
  ex({
    key: 'diamond-pushup', name: 'Diamond Push-ups', category: 'strength', met: 8.0,
    primary: ['Triceps', 'Chest'], secondary: ['Shoulders', 'Core'], difficulty: 'advanced',
    description: 'A narrow-hand push-up that shifts the work heavily onto the triceps.',
    instructions: ['Form a diamond under your chest with thumbs and index fingers.', 'Lower until your chest touches your hands.', 'Press up keeping elbows tucked.'],
    mistakes: ['Elbows winging outward', 'Head diving before the chest'],
    modifications: ['Easier: standard or knee push-ups.'],
    reps: 8, tracking: 'camera-reps', poseKey: 'pushup', mediaQuery: 'diamond push-up',
  }),
  ex({
    key: 'wide-pushup', name: 'Wide Push-ups', category: 'strength', met: 8.0,
    primary: ['Chest'], secondary: ['Shoulders', 'Triceps'], difficulty: 'intermediate',
    description: 'A wide-hand push-up variation emphasizing the outer chest.',
    instructions: ['Set hands ~1.5× shoulder width.', 'Lower under control to chest depth.', 'Drive back up without shrugging.'],
    mistakes: ['Going so wide the shoulders strain', 'Half reps'],
    modifications: ['Easier: from knees.'],
    reps: 10, tracking: 'camera-reps', poseKey: 'pushup', mediaQuery: 'wide push-up',
  }),
  ex({
    key: 'squat', name: 'Squats', category: 'strength', met: 5.0,
    primary: ['Quadriceps', 'Glutes'], secondary: ['Hamstrings', 'Core'],
    description: 'The fundamental lower-body movement: sit your hips back and down, then stand tall.',
    instructions: ['Stand with feet shoulder-width, toes slightly out.', 'Sit back and down until thighs are at least parallel.', 'Drive through your heels back to standing.'],
    mistakes: ['Knees caving inward', 'Heels lifting off the floor', 'Shallow depth'],
    modifications: ['Easier: squat to a chair.', 'Harder: jump squats or slow tempo.'],
    reps: 15, tracking: 'camera-reps', poseKey: 'squat', mediaQuery: 'squat', quickPick: true,
  }),
  ex({
    key: 'jump-squat', name: 'Jump Squats', category: 'strength', met: 8.0,
    primary: ['Quadriceps', 'Glutes'], secondary: ['Calves', 'Core'], difficulty: 'intermediate',
    description: 'An explosive squat finishing with a jump — strength and conditioning in one move.',
    instructions: ['Squat to parallel.', 'Explode upward into a jump.', 'Land softly and sink straight into the next rep.'],
    mistakes: ['Landing stiff-legged', 'Letting knees collapse on landing'],
    safety: ['Land softly with bent knees.', 'Skip if you have knee issues.'],
    modifications: ['Easier: regular squats.'],
    reps: 10, tracking: 'camera-reps', poseKey: 'squat', mediaQuery: 'jump squat',
  }),
  ex({
    key: 'lunge', name: 'Lunges', category: 'strength', met: 4.0,
    primary: ['Quadriceps', 'Glutes'], secondary: ['Hamstrings', 'Calves'],
    description: 'A single-leg strength staple: step forward and lower both knees to 90°.',
    instructions: ['Step forward into a long stride.', 'Lower until both knees are near 90°, back knee hovering.', 'Push through the front heel to return, then switch legs.'],
    mistakes: ['Front knee shooting past the toes', 'Torso pitching forward', 'Short strides'],
    modifications: ['Easier: hold a wall for balance.', 'Harder: reverse or walking lunges.'],
    reps: 12, tracking: 'camera-reps', poseKey: 'lunge', mediaQuery: 'lunge', quickPick: true,
  }),
  ex({
    key: 'reverse-lunge', name: 'Reverse Lunges', category: 'strength', met: 4.0,
    primary: ['Glutes', 'Quadriceps'], secondary: ['Hamstrings', 'Core'],
    description: 'Lunges stepping backward — friendlier on the knees and great for glute drive.',
    instructions: ['Step one foot back into a long stance.', 'Lower the back knee toward the floor.', 'Drive through the front heel to stand and switch.'],
    mistakes: ['Stance too narrow to balance', 'Slamming the back knee down'],
    modifications: ['Easier: shallow range.', 'Harder: add a knee drive on the way up.'],
    reps: 12, tracking: 'camera-reps', poseKey: 'lunge', mediaQuery: 'reverse lunge',
  }),
  ex({
    key: 'bulgarian-split-squat', name: 'Bulgarian Split Squats', category: 'strength', met: 6.0,
    primary: ['Quadriceps', 'Glutes'], secondary: ['Hamstrings', 'Core'], difficulty: 'advanced', equipment: 'bench or chair',
    description: 'A rear-foot-elevated split squat that hammers each leg individually.',
    instructions: ['Place your rear foot on a bench behind you.', 'Lower straight down until the front thigh is parallel.', 'Drive up through the front heel.'],
    mistakes: ['Bouncing at the bottom', 'Front foot too close to the bench'],
    modifications: ['Easier: regular split squats on the floor.'],
    reps: 8, tracking: 'camera-reps', poseKey: 'lunge', mediaQuery: 'split squat',
  }),
  ex({
    key: 'wall-sit', name: 'Wall Sit', category: 'strength', met: 3.3,
    primary: ['Quadriceps'], secondary: ['Glutes', 'Core'],
    description: 'An isometric squat hold against a wall — simple, brutal, effective.',
    instructions: ['Slide down a wall until knees reach 90°.', 'Keep your whole back flat against the wall.', 'Hold, breathing steadily.'],
    mistakes: ['Thighs above parallel', 'Hands braced on the knees'],
    modifications: ['Easier: shallower angle or shorter hold.', 'Harder: extend one leg.'],
    durationSec: 45, sets: 3, tracking: 'camera-hold', poseKey: 'wall-sit', mediaQuery: 'wall sit', quickPick: true,
  }),
  ex({
    key: 'calf-raise', name: 'Calf Raises', category: 'strength', met: 3.0,
    primary: ['Calves'], secondary: [],
    description: 'Rise onto your toes and lower slowly to build calf strength and ankle stability.',
    instructions: ['Stand tall, feet hip-width.', 'Rise as high as possible onto the balls of your feet.', 'Lower with a slow 2-second descent.'],
    mistakes: ['Bouncing', 'Partial range at the top'],
    modifications: ['Harder: single-leg, or off a step for extra range.'],
    reps: 20, mediaQuery: 'calf raise',
  }),
  ex({
    key: 'glute-bridge', name: 'Glute Bridges', category: 'strength', met: 3.5,
    primary: ['Glutes'], secondary: ['Hamstrings', 'Core'],
    description: 'Lying hip extension: squeeze your glutes to lift your hips into a straight line.',
    instructions: ['Lie on your back, knees bent, feet flat near your hips.', 'Drive through your heels and squeeze your glutes to lift your hips.', 'Pause at the top, lower with control.'],
    mistakes: ['Arching the lower back instead of extending the hips', 'Pushing through the toes'],
    modifications: ['Harder: single-leg bridges or hip thrusts.'],
    reps: 15, tracking: 'camera-reps', poseKey: 'glute-bridge', mediaQuery: 'glute bridge', quickPick: true,
  }),
  ex({
    key: 'hip-thrust', name: 'Hip Thrusts', category: 'strength', met: 4.0,
    primary: ['Glutes'], secondary: ['Hamstrings', 'Core'], difficulty: 'intermediate', equipment: 'bench or chair',
    description: 'A shoulder-elevated bridge with a bigger range of motion for maximum glute work.',
    instructions: ['Rest your upper back on a bench, feet planted.', 'Drop your hips, then drive them up until your body is level.', 'Squeeze hard at the top for a second.'],
    mistakes: ['Hyperextending the lower back at the top', 'Chin jutting up'],
    modifications: ['Easier: glute bridge on the floor.'],
    reps: 12, tracking: 'camera-reps', poseKey: 'glute-bridge', mediaQuery: 'hip thrust',
  }),
  ex({
    key: 'donkey-kick', name: 'Donkey Kicks', category: 'strength', met: 3.0,
    primary: ['Glutes'], secondary: ['Hamstrings', 'Core'],
    description: 'On all fours, kick one bent leg up toward the ceiling with a controlled glute squeeze.',
    instructions: ['Start on hands and knees, back flat.', 'Keeping the knee bent 90°, drive one heel toward the ceiling.', 'Lower without touching down and repeat, then switch.'],
    mistakes: ['Arching the lower back to fake height', 'Rushing the reps'],
    reps: 15, mediaQuery: 'donkey kick',
  }),
  ex({
    key: 'fire-hydrant', name: 'Fire Hydrants', category: 'strength', met: 3.0,
    primary: ['Glutes'], secondary: ['Hip abductors', 'Core'],
    description: 'On all fours, lift a bent leg out to the side to target the glute medius.',
    instructions: ['Start on hands and knees.', 'Keeping the knee bent, lift one leg out to the side to hip height.', 'Lower with control; switch sides after the set.'],
    mistakes: ['Tilting the torso to lift higher', 'Wrists ahead of shoulders'],
    reps: 12, mediaQuery: 'fire hydrant',
  }),
  ex({
    key: 'step-up', name: 'Step-ups', category: 'strength', met: 5.5,
    primary: ['Quadriceps', 'Glutes'], secondary: ['Hamstrings', 'Calves'], equipment: 'sturdy step or box',
    description: 'Step onto a raised surface with full control — single-leg strength with cardio spillover.',
    instructions: ['Place one whole foot on the step.', 'Drive through that heel to stand tall on top.', 'Lower slowly with the same leg; alternate.'],
    mistakes: ['Pushing off the bottom leg', 'Knee collapsing inward'],
    modifications: ['Easier: lower step.', 'Harder: higher step or add a knee drive.'],
    reps: 10, mediaQuery: 'step-up', quickPick: true,
  }),
  ex({
    key: 'bicep-curl', name: 'Bicep Curls', category: 'strength', met: 3.5,
    primary: ['Biceps'], secondary: ['Forearms'], equipment: 'dumbbells',
    description: 'Curl a weight from full extension to full flexion without swinging.',
    instructions: ['Stand tall, elbows pinned to your sides.', 'Curl the weight to your shoulder.', 'Lower slowly to a full stretch.'],
    mistakes: ['Swinging the torso', 'Elbows drifting forward', 'Half range'],
    reps: 12, tracking: 'camera-reps', poseKey: 'bicep-curl', mediaQuery: 'dumbbell curl',
  }),

  // ──────────────────────────────── Core ─────────────────────────────────────
  ex({
    key: 'situp', name: 'Sit-ups', category: 'core', met: 8.0,
    primary: ['Abs'], secondary: ['Hip flexors'],
    description: 'Curl your whole torso from the floor to your knees and back with control.',
    instructions: ['Lie back, knees bent, feet flat.', 'Curl your torso all the way up toward your knees.', 'Lower slowly, one vertebra at a time.'],
    mistakes: ['Yanking the neck', 'Using momentum', 'Feet flying up'],
    modifications: ['Easier: crunches.', 'Harder: slow 3-second descents.'],
    reps: 15, tracking: 'camera-reps', poseKey: 'situp', mediaQuery: 'sit-up', quickPick: true,
  }),
  ex({
    key: 'crunch', name: 'Crunches', category: 'core', met: 3.8,
    primary: ['Abs'], secondary: [],
    description: 'A short-range trunk curl that keeps constant tension on the abs.',
    instructions: ['Lie back with knees bent, hands by your temples.', 'Curl your shoulder blades off the floor.', 'Lower under control without resting.'],
    mistakes: ['Pulling on the head', 'Coming up too high and using hip flexors'],
    modifications: ['Harder: hold the top for 2 seconds each rep.'],
    reps: 20, tracking: 'camera-reps', poseKey: 'crunch', mediaQuery: 'crunch', quickPick: true,
  }),
  ex({
    key: 'bicycle-crunch', name: 'Bicycle Crunches', category: 'core', met: 8.0,
    primary: ['Abs', 'Obliques'], secondary: ['Hip flexors'],
    description: 'Alternate elbow-to-knee twists in a pedaling rhythm for abs and obliques together.',
    instructions: ['Lie back, hands by your temples, legs lifted.', 'Bring one elbow toward the opposite knee while extending the other leg.', 'Alternate sides in a smooth pedaling motion.'],
    mistakes: ['Flapping elbows instead of rotating the torso', 'Neck strain'],
    reps: 20, mediaQuery: 'bicycle crunch', quickPick: true,
  }),
  ex({
    key: 'air-bike', name: 'Air Bike', category: 'core', met: 8.0,
    primary: ['Abs', 'Obliques'], secondary: ['Hip flexors'],
    description: 'A continuous cycling motion on your back — a timed core burner.',
    instructions: ['Lie back with legs raised, shins parallel to the floor.', 'Pedal your legs continuously as if cycling.', 'Keep your lower back pressed into the floor.'],
    mistakes: ['Lower back arching off the floor', 'Holding your breath'],
    durationSec: 30, sets: 3, mediaQuery: 'air bike', quickPick: true,
  }),
  ex({
    key: 'flutter-kick', name: 'Flutter Kicks', category: 'core', met: 4.0,
    primary: ['Lower abs'], secondary: ['Hip flexors'],
    description: 'Small, fast alternating leg kicks that torch the lower abs.',
    instructions: ['Lie back, legs straight and lifted ~30 cm.', 'Kick your legs up and down in small, quick pulses.', 'Keep your lower back glued to the floor.'],
    mistakes: ['Back arching', 'Kicks too big and slow'],
    durationSec: 30, sets: 3, mediaQuery: 'flutter kicks',
  }),
  ex({
    key: 'leg-raise', name: 'Leg Raises', category: 'core', met: 4.0,
    primary: ['Lower abs'], secondary: ['Hip flexors'], difficulty: 'intermediate',
    description: 'Raise straight legs to vertical and lower them slowly without arching your back.',
    instructions: ['Lie flat, hands under your hips.', 'Lift straight legs to vertical.', 'Lower slowly, stopping before your back arches.'],
    mistakes: ['Lower back lifting off the floor', 'Dropping the legs fast'],
    modifications: ['Easier: bend the knees.', 'Harder: pause 5 cm off the floor.'],
    reps: 12, mediaQuery: 'leg raise',
  }),
  ex({
    key: 'reverse-crunch', name: 'Reverse Crunches', category: 'core', met: 3.8,
    primary: ['Lower abs'], secondary: [],
    description: 'Curl your hips off the floor toward your chest — the crunch, inverted.',
    instructions: ['Lie back, knees bent above your hips.', 'Curl your hips up and toward your ribs.', 'Lower with control until your tailbone touches down.'],
    mistakes: ['Swinging the legs for momentum', 'Neck tensing'],
    reps: 15, mediaQuery: 'reverse crunch',
  }),
  ex({
    key: 'russian-twist', name: 'Russian Twists', category: 'core', met: 4.0,
    primary: ['Obliques'], secondary: ['Abs', 'Hip flexors'],
    description: 'Seated torso rotations side to side with your feet hovering.',
    instructions: ['Sit leaning back ~45°, knees bent, heels light or lifted.', 'Rotate your torso to tap the floor beside each hip.', 'Keep your chest tall throughout.'],
    mistakes: ['Just swinging the arms without rotating', 'Rounding the back'],
    modifications: ['Easier: heels on the floor.', 'Harder: hold a weight.'],
    reps: 20, mediaQuery: 'russian twist', quickPick: true,
  }),
  ex({
    key: 'plank', name: 'Plank', category: 'core', met: 3.3,
    primary: ['Core'], secondary: ['Shoulders', 'Glutes'],
    description: 'The isometric gold standard: hold a perfectly straight line from head to heels.',
    instructions: ['Forearms down, elbows under shoulders.', 'Squeeze glutes and brace your abs to form one straight line.', 'Hold while breathing steadily.'],
    mistakes: ['Hips sagging', 'Hips piked high', 'Head dropping'],
    modifications: ['Easier: from knees.', 'Harder: lift one foot.'],
    durationSec: 30, sets: 3, tracking: 'camera-hold', poseKey: 'plank', mediaQuery: 'plank', quickPick: true,
  }),
  ex({
    key: 'side-plank', name: 'Side Plank', category: 'core', met: 3.0,
    primary: ['Obliques'], secondary: ['Shoulders', 'Glutes'], difficulty: 'intermediate',
    description: 'A lateral plank hold on one forearm for oblique and hip strength.',
    instructions: ['Lie on one side, elbow under shoulder.', 'Lift your hips into a straight line.', 'Hold, then switch sides.'],
    mistakes: ['Hips dipping', 'Rolling the chest toward the floor'],
    modifications: ['Easier: bottom knee down.'],
    durationSec: 20, sets: 2, mediaQuery: 'side plank',
  }),
  ex({
    key: 'hollow-hold', name: 'Hollow Hold', category: 'core', met: 3.5,
    primary: ['Abs'], secondary: ['Hip flexors'], difficulty: 'intermediate',
    description: 'A gymnastics staple: press your lower back down and hold a shallow banana shape.',
    instructions: ['Lie back, press your lower back into the floor.', 'Lift shoulders and legs slightly off the ground, arms overhead.', 'Hold the shape without letting the back arch.'],
    mistakes: ['Lower back popping off the floor', 'Chin tucked to chest'],
    modifications: ['Easier: knees bent, arms by sides.'],
    durationSec: 20, sets: 3, mediaQuery: 'hollow hold',
  }),
  ex({
    key: 'mountain-climber', name: 'Mountain Climbers', category: 'core', met: 8.0,
    primary: ['Core'], secondary: ['Shoulders', 'Hip flexors', 'Quads'],
    description: 'Drive your knees to your chest from a plank in a fast running rhythm.',
    instructions: ['Start in a high plank.', 'Drive one knee toward your chest, then switch in a running rhythm.', 'Keep hips level and low.'],
    mistakes: ['Hips bouncing high', 'Hands drifting ahead of shoulders'],
    durationSec: 30, sets: 3, tracking: 'camera-reps', poseKey: 'mountain-climber', mediaQuery: 'mountain climber', quickPick: true,
  }),

  // ─────────────────────────────── Cardio ────────────────────────────────────
  ex({
    key: 'jump-rope', name: 'Rope Skipping', category: 'cardio', met: 11.0,
    primary: ['Calves', 'Cardio'], secondary: ['Shoulders', 'Core'], equipment: 'jump rope',
    description: 'Classic rope skipping — elite conditioning and footwork in minutes.',
    instructions: ['Elbows in, spin the rope from the wrists.', 'Jump just high enough to clear the rope.', 'Land softly on the balls of your feet.'],
    mistakes: ['Jumping too high', 'Arms swinging wide'],
    modifications: ['No rope? Mimic the motion — same benefit.'],
    durationSec: 60, sets: 3, restSec: 30, mediaQuery: 'jump rope', quickPick: true,
  }),
  ex({
    key: 'jumping-jack', name: 'Jumping Jacks', category: 'cardio', met: 8.0,
    primary: ['Full body', 'Cardio'], secondary: ['Calves', 'Shoulders'],
    description: 'The warm-up classic: jump feet wide while sweeping arms overhead.',
    instructions: ['Start standing, arms at your sides.', 'Jump feet wide while raising arms overhead.', 'Jump back to the start and repeat rhythmically.'],
    mistakes: ['Arms not reaching overhead', 'Landing heavily'],
    reps: 20, tracking: 'camera-reps', poseKey: 'jumping-jack', mediaQuery: 'jumping jack', quickPick: true,
  }),
  ex({
    key: 'burpee', name: 'Burpees', category: 'cardio', met: 8.0,
    primary: ['Full body', 'Cardio'], secondary: ['Chest', 'Quads', 'Core'], difficulty: 'intermediate',
    description: 'Squat, kick back, push-up, jump — the ultimate full-body conditioner.',
    instructions: ['Squat down, hands to the floor.', 'Kick back to a plank and do a push-up.', 'Jump feet back in and leap up with arms overhead.'],
    mistakes: ['Sagging hips in the plank', 'Skipping the jump when tired'],
    modifications: ['Easier: step back instead of jumping, skip the push-up.'],
    reps: 10, mediaQuery: 'burpee', quickPick: true,
  }),
  ex({
    key: 'high-knees', name: 'High Knees', category: 'cardio', met: 8.0,
    primary: ['Hip flexors', 'Cardio'], secondary: ['Quads', 'Calves', 'Core'],
    description: 'Sprint on the spot, driving your knees to hip height.',
    instructions: ['Run in place, driving knees up to hip level.', 'Pump your arms in rhythm.', 'Stay on the balls of your feet.'],
    mistakes: ['Knees staying low', 'Leaning back'],
    durationSec: 30, sets: 3, tracking: 'camera-reps', poseKey: 'high-knees', mediaQuery: 'high knee', quickPick: true,
  }),
  ex({
    key: 'butt-kick', name: 'Butt Kicks', category: 'cardio', met: 7.0,
    primary: ['Hamstrings', 'Cardio'], secondary: ['Calves'],
    description: 'Jog in place kicking your heels to your glutes.',
    instructions: ['Jog on the spot.', 'Kick each heel up to touch your glutes.', 'Keep a quick, light rhythm.'],
    mistakes: ['Leaning forward', 'Slow, heavy steps'],
    durationSec: 30, sets: 3, mediaQuery: 'butt kick',
  }),
  ex({
    key: 'running', name: 'Running', category: 'cardio', met: 9.8,
    primary: ['Legs', 'Cardio'], secondary: ['Core'],
    description: 'Steady-state running — outdoors or on a treadmill.',
    instructions: ['Warm up with 2–3 minutes of brisk walking.', 'Settle into a pace where you can speak in short sentences.', 'Finish with an easy walk to cool down.'],
    mistakes: ['Starting too fast', 'Overstriding'],
    durationSec: 1200, sets: 1, restSec: 0, mediaQuery: 'run',
  }),
  ex({
    key: 'walking', name: 'Walking', category: 'cardio', met: 3.5,
    primary: ['Legs', 'Cardio'], secondary: [],
    description: 'Brisk walking — the most underrated fat-burning and recovery tool.',
    instructions: ['Walk at a pace that raises your breathing.', 'Swing your arms naturally.', 'Keep your posture tall.'],
    mistakes: ['Strolling too slowly to raise the heart rate'],
    durationSec: 1800, sets: 1, restSec: 0, mediaQuery: 'walking',
  }),
  ex({
    key: 'sprint', name: 'Sprints', category: 'cardio', met: 12.0,
    primary: ['Legs', 'Cardio'], secondary: ['Core'], difficulty: 'advanced',
    description: 'Short maximal-effort runs with full recovery between them.',
    instructions: ['Warm up thoroughly first.', 'Sprint hard for the interval.', 'Walk until fully recovered before the next one.'],
    mistakes: ['Sprinting cold', 'Cutting recovery short'],
    safety: ['Warm up 5+ minutes before the first sprint.', 'Stop at any hamstring twinge.'],
    durationSec: 20, sets: 6, restSec: 90, mediaQuery: 'sprint',
  }),
  ex({
    key: 'stair-climb', name: 'Stair Climbing', category: 'cardio', met: 8.8,
    primary: ['Quads', 'Glutes', 'Cardio'], secondary: ['Calves'],
    description: 'Climb stairs continuously for a low-skill, high-return cardio hit.',
    instructions: ['Climb at a steady rhythm.', 'Use the whole foot on each step.', 'Walk down easy as recovery.'],
    mistakes: ['Pulling yourself up by the rail', 'Looking down at your feet'],
    durationSec: 300, sets: 2, restSec: 60, mediaQuery: 'stair',
  }),
  ex({
    key: 'shadow-boxing', name: 'Shadow Boxing', category: 'cardio', met: 7.8,
    primary: ['Shoulders', 'Cardio'], secondary: ['Core', 'Arms'],
    description: 'Throw combinations at the air with footwork — cardio that never gets boring.',
    instructions: ['Take a boxing stance, hands up.', 'Throw jabs, crosses, and hooks in combinations.', 'Keep moving your feet between combos.'],
    mistakes: ['Dropping your hands', 'Standing flat-footed'],
    durationSec: 120, sets: 3, restSec: 45, mediaQuery: 'boxing', quickPick: true,
  }),

  // ──────────────────────────────── Yoga ─────────────────────────────────────
  ex({
    key: 'sun-salutation', name: 'Sun Salutation', category: 'yoga', met: 3.3,
    primary: ['Full body'], secondary: ['Core', 'Shoulders'],
    description: 'A flowing sequence linking forward folds, plank, cobra, and downward dog.',
    instructions: ['Inhale, sweep arms overhead.', 'Exhale, fold forward; step back to plank.', 'Lower, rise into cobra, then press back to downward dog.', 'Step forward and rise to standing.'],
    mistakes: ['Rushing the flow ahead of the breath', 'Collapsing in the lower back on cobra'],
    durationSec: 300, sets: 1, restSec: 0, mediaQuery: 'sun salutation', quickPick: true,
  }),
  ex({
    key: 'child-pose', name: "Child's Pose", category: 'yoga', met: 2.0,
    primary: ['Lower back'], secondary: ['Hips', 'Shoulders'],
    description: 'A restful kneeling fold that decompresses the spine and hips.',
    instructions: ['Kneel, big toes together, knees wide.', 'Fold forward, arms extended, forehead to the floor.', 'Breathe deep into your back.'],
    mistakes: ['Shoulders hunched to the ears'],
    durationSec: 60, sets: 1, mediaQuery: 'child pose',
  }),
  ex({
    key: 'cobra', name: 'Cobra Pose', category: 'yoga', met: 2.3,
    primary: ['Lower back'], secondary: ['Chest', 'Shoulders'],
    description: 'A gentle prone backbend that opens the chest and strengthens the spine.',
    instructions: ['Lie face down, hands under shoulders.', 'Press the chest up, hips staying on the floor.', 'Keep elbows soft and shoulders away from your ears.'],
    mistakes: ['Pushing to full arm lockout and jamming the lower back'],
    durationSec: 30, sets: 2, mediaQuery: 'cobra',
  }),
  ex({
    key: 'downward-dog', name: 'Downward Dog', category: 'yoga', met: 2.5,
    primary: ['Hamstrings', 'Shoulders'], secondary: ['Calves', 'Back'],
    description: 'The inverted-V pose stretching the whole posterior chain.',
    instructions: ['From all fours, lift your hips high to form a V.', 'Press the floor away through your palms.', 'Pedal the heels toward the floor.'],
    mistakes: ['Rounding the back to force heels down', 'Weight dumped into the wrists'],
    durationSec: 45, sets: 2, mediaQuery: 'downward dog',
  }),
  ex({
    key: 'warrior-pose', name: 'Warrior Pose', category: 'yoga', met: 2.5,
    primary: ['Quads', 'Hips'], secondary: ['Shoulders', 'Core'],
    description: 'A strong standing lunge hold with arms extended.',
    instructions: ['Step into a long stance, front knee bent to 90°.', 'Raise your arms and sink into the front leg.', 'Hold, gaze forward; switch sides.'],
    mistakes: ['Front knee drifting past the ankle', 'Back foot fully turned out'],
    durationSec: 30, sets: 2, mediaQuery: 'warrior',
  }),
  ex({
    key: 'tree-pose', name: 'Tree Pose', category: 'yoga', met: 2.0,
    primary: ['Balance', 'Hips'], secondary: ['Core', 'Ankles'],
    description: 'A single-leg balance with the other foot pressed to the inner thigh.',
    instructions: ['Stand tall; place one foot on the inner calf or thigh (never the knee).', 'Press palms together at your chest.', 'Fix your gaze on one point and hold; switch sides.'],
    mistakes: ['Foot braced against the knee joint', 'Hip jutting out'],
    durationSec: 30, sets: 2, mediaQuery: 'tree pose',
  }),

  // ───────────────────────────── Stretching ──────────────────────────────────
  ex({
    key: 'full-body-stretch', name: 'Full Body Stretch', category: 'stretching', met: 2.3,
    primary: ['Full body'], secondary: [],
    description: 'A head-to-toe cooldown flow: neck, shoulders, back, hips, and legs.',
    instructions: ['Roll the neck and shoulders gently.', 'Reach overhead, then fold to touch your toes.', 'Open the hips with a deep squat hold, then stretch each leg.'],
    mistakes: ['Bouncing in stretches', 'Holding your breath'],
    durationSec: 300, sets: 1, restSec: 0, mediaQuery: 'stretch', quickPick: true,
  }),
  ex({
    key: 'hip-stretch', name: 'Hip Stretches', category: 'stretching', met: 2.3,
    primary: ['Hip flexors', 'Glutes'], secondary: ['Lower back'],
    description: 'Kneeling hip-flexor lunge and figure-four stretches to undo sitting.',
    instructions: ['Kneeling lunge: push hips forward gently, 30s each side.', 'Figure-four: cross ankle over knee and pull the leg in, 30s each side.'],
    mistakes: ['Arching the lower back in the lunge stretch'],
    durationSec: 120, sets: 1, restSec: 0, mediaQuery: 'hip stretch',
  }),
  ex({
    key: 'hamstring-stretch', name: 'Hamstring Stretches', category: 'stretching', met: 2.3,
    primary: ['Hamstrings'], secondary: ['Calves', 'Lower back'],
    description: 'Standing and seated forward folds to lengthen the back of the legs.',
    instructions: ['Standing fold: hinge at the hips, soft knees, 30s.', 'Seated: reach for your toes with a long spine, 30s each leg.'],
    mistakes: ['Rounding the spine to reach further', 'Locking the knees hard'],
    durationSec: 120, sets: 1, restSec: 0, mediaQuery: 'hamstring stretch',
  }),
  ex({
    key: 'shoulder-stretch', name: 'Shoulder Stretches', category: 'stretching', met: 2.3,
    primary: ['Shoulders'], secondary: ['Chest', 'Upper back'],
    description: 'Cross-body and overhead triceps stretches to free up the shoulders.',
    instructions: ['Pull one arm across your chest, 30s each side.', 'Reach one hand down your back and assist with the other, 30s each side.'],
    mistakes: ['Shrugging into the stretch'],
    durationSec: 120, sets: 1, restSec: 0, mediaQuery: 'shoulder stretch',
  }),
];

export const EXERCISE_CATALOG: Record<string, CatalogExercise> = Object.fromEntries(LIST.map((e) => [e.key, e]));

export const QUICK_PICK_EXERCISES: CatalogExercise[] = LIST.filter((e) => e.quickPick);

export const CATALOG_CATEGORIES: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'strength', label: 'Strength' },
  { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'stretching', label: 'Stretching' },
];

/** kcal = MET × kg × hours */
export function estimateCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

/** Total active minutes of one exercise at its default volume. */
export function defaultActiveMinutes(exercise: CatalogExercise): number {
  if (exercise.type === 'timed') {
    return (exercise.defaultSets * (exercise.defaultDurationSec ?? 30)) / 60;
  }
  // ~3 seconds per rep is a reasonable steady tempo
  return (exercise.defaultSets * (exercise.defaultReps ?? 12) * 3) / 60;
}
