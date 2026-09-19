/**
 * Kobblon measures everything in stons.
 *
 * One ston is 0.2 metres, so K6 at ten stons is a two metre avatar. The
 * engine works in stons throughout rather than converting at the edges: a
 * number in a scene file, a number in the physics and a number a creator
 * types are the same number.
 */
export const STON = 0.2

/** Metres per second squared, expressed in stons, which is what we integrate. */
export const GRAVITY = 9.81 / STON

/** How tall K6 stands, which the controller needs to keep a head out of a ceiling. */
export const K6_HEIGHT = 10

/** Half the width of the box the controller pushes around the world. */
export const K6_RADIUS = 1.6

export const seconds = (ms: number) => ms / 1000
