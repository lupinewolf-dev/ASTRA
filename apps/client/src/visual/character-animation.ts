import * as THREE from "three";

export type CharacterAction = {
  aiming?: boolean;
  dodging?: boolean;
  recoil?: number;
  melee?: boolean;
};
type Pose = {
  time: number;
  phase: number;
  stride: number;
  joints: Map<string, THREE.Object3D>;
};
const poses = new WeakMap<THREE.Group, Pose>();

/** Layered rigid-joint animation for the sculpted farmer; no shared asset mutation. */
export function animateCharacter(
  group: THREE.Group,
  distance: number,
  heading: number,
  seconds: number,
  movement?: { x: number; y: number },
  action: CharacterAction = {},
) {
  let pose = poses.get(group);
  if (!pose) {
    const joints = new Map<string, THREE.Object3D>();
    group.traverse((part) => {
      if (part.name) joints.set(part.name, part);
    });
    pose = { time: 0, phase: 0, stride: 0, joints };
    poses.set(group, pose);
  }
  const dt = Math.max(0, Math.min(seconds, 0.1));
  const blend = 1 - Math.exp(-14 * dt);
  const moving = distance > 0.00001;
  pose.time += dt;
  if (moving) pose.phase += distance * 4;
  pose.stride +=
    ((moving ? Math.min(1, distance / Math.max(dt, 0.001) / 2.5) : 0) -
      pose.stride) *
    blend;
  if (pose.stride < 0.001) pose.stride = 0;
  const joint = (name: string) => pose!.joints.get(name)!;
  const rotate = (name: string, x: number, y = 0, z = 0) => {
    const r = joint(name).rotation;
    r.x += (x - r.x) * blend;
    r.y += (y - r.y) * blend;
    r.z += (z - r.z) * blend;
    if (x === 0 && Math.abs(r.x) < 0.0001) r.x = 0;
    if (y === 0 && Math.abs(r.y) < 0.0001) r.y = 0;
    if (z === 0 && Math.abs(r.z) < 0.0001) r.z = 0;
  };
  const turn = Math.atan2(
    Math.sin(heading - group.rotation.y),
    Math.cos(heading - group.rotation.y),
  );
  if (moving || action.aiming) {
    group.rotation.y += turn * (1 - Math.exp(-12 * dt));
    if (Math.abs(turn) < 0.001) group.rotation.y = heading;
  }
  const length = movement ? Math.hypot(movement.x, movement.y) : 0;
  const forward = length
    ? (movement!.x * Math.sin(group.rotation.y) +
        movement!.y * Math.cos(group.rotation.y)) /
      length
    : 1;
  const side = length
    ? (movement!.x * Math.cos(group.rotation.y) -
        movement!.y * Math.sin(group.rotation.y)) /
      length
    : 0;
  const dodge = action.dodging ? 1 : 0;
  for (const [label, offset, sign] of [
    ["left", 0, -1],
    ["right", Math.PI, 1],
  ] as const) {
    const cycle = Math.sin(pose.phase + offset);
    const swing = cycle * 0.48 * pose.stride;
    const knee = 0.06 + Math.max(0, cycle) * 0.8 * pose.stride + dodge * 0.3;
    const hip = -swing * forward - dodge * 0.32;
    rotate(`${label}-leg`, hip, 0, swing * side);
    rotate(`${label}-knee`, knee);
    rotate(`${label}-ankle`, -(hip + knee) * 0.65);
    const aiming = !!action.aiming;
    const striking = label === "left" && !!action.melee;
    rotate(
      `${label}-arm`,
      striking
        ? -1.25
        : aiming
          ? label === "right"
            ? -1.05
            : -0.25
          : swing * forward * 0.65 - dodge * 0.45,
      0,
      striking
        ? 0.35
        : aiming
          ? label === "left"
            ? 0.18
            : -0.08
          : sign * 0.06 + swing * side * 0.3,
    );
    rotate(
      `${label}-elbow`,
      striking
        ? -0.9
        : aiming
          ? label === "right"
            ? -0.45
            : -1.15
          : -0.12 - Math.max(0, -cycle) * 0.22 * pose.stride - dodge * 0.5,
    );
    rotate(
      `${label}-wrist`,
      aiming ? 0.06 - (action.recoil ?? 0) * 0.16 : -0.03,
    );
  }
  const breath = Math.sin(pose.time * 2.1);
  const torso = joint("torso");
  torso.position.y = 1.45 + breath * 0.009;
  rotate(
    "torso",
    -0.035 * pose.stride * forward -
      dodge * 0.35 -
      (action.recoil ?? 0) * 0.045,
    Math.sin(pose.phase) * 0.045 * pose.stride * (action.aiming ? 0.25 : 1),
    -Math.sin(pose.phase) * 0.025 * pose.stride - dodge * 0.12,
  );
  rotate(
    "head",
    breath * 0.012 + dodge * 0.16,
    Math.max(-0.28, Math.min(0.28, turn)) *
      (action.aiming ? 0.8 : moving ? 0.35 : 0),
  );
  joint("body").position.y =
    Math.abs(Math.sin(pose.phase)) * 0.022 * pose.stride;
  const blinkTime = pose.time % 4.1;
  const blink =
    blinkTime > 3.85
      ? 1 - Math.sin(((blinkTime - 3.85) / 0.25) * Math.PI) * 0.94
      : 1;
  joint("left-eye").scale.y = blink;
  joint("right-eye").scale.y = blink;
  group.userData.poseFrame = (group.userData.poseFrame ?? 0) + 1;
}
