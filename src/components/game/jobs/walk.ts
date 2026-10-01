// Walking inside a job's room. Everyone (you, guests, the host) follows a
// path of points; you also get there by arrow keys, inside the room's bounds.

export type Point = { x: number; z: number };
export type Walker = Point & { rot: number; speed: number; path: Point[] };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

// The same pace as walking around the island, so the steps read.
export const PLAYER_WALK = 4.6;

export function walker(at: Point, rot = Math.PI, path: Point[] = []): Walker {
  return { x: at.x, z: at.z, rot, speed: 0, path: [...path] };
}

export function stepWalker(walker: Walker, delta: number, speed: number) {
  const target = walker.path[0];
  if (!target) {
    walker.speed = 0;
    return true;
  }
  const dx = target.x - walker.x;
  const dz = target.z - walker.z;
  const d = Math.hypot(dx, dz);
  const step = speed * delta;
  if (d <= step) {
    walker.x = target.x;
    walker.z = target.z;
    walker.path.shift();
  } else {
    walker.x += (dx / d) * step;
    walker.z += (dz / d) * step;
    walker.rot = Math.atan2(dx, dz);
  }
  walker.speed = speed;
  return walker.path.length === 0;
}

// You, in whichever room is open. The job's store places you and sends you
// places; the room's player component moves you every frame.
export const jobPlayer = {
  walker: walker({ x: 0, z: 0 }),
  // What happens when you get where you were going.
  arrive: null as null | (() => void),
  bounds: { minX: -5, maxX: 5, minZ: -3, maxZ: 3 } as Bounds,
  // While a panel is open (or you're on your way out) the keys don't move you.
  locked: false,
};

export function placePlayer(at: Point, rot: number, path: Point[], bounds: Bounds) {
  jobPlayer.walker = walker(at, rot, path);
  jobPlayer.arrive = null;
  jobPlayer.bounds = bounds;
  jobPlayer.locked = false;
}

export function walkTo(target: Point | Point[], then: () => void) {
  jobPlayer.walker.path = Array.isArray(target) ? [...target] : [target];
  jobPlayer.arrive = then;
}

// Called every frame by the player component.
export function stepPlayer(delta: number) {
  if (stepWalker(jobPlayer.walker, delta, PLAYER_WALK) && jobPlayer.arrive) {
    const then = jobPlayer.arrive;
    jobPlayer.arrive = null;
    then();
  }
}
